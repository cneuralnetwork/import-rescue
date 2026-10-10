import "dotenv/config";
import express from "express";
import Papa from "papaparse";
import { z } from "zod";
import { createStore } from "./store.js";
import { SCHEMA } from "./engine.js";
import { demoCSV, scenarios } from "./fixtures.js";
import {
  setupTelemetry,
  integrationStatus,
  workflow,
  tool,
  advise,
  closeTelemetry,
} from "./telemetry.js";
import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";

await setupTelemetry();
const store = createStore(process.env.DB_PATH || "data/staging.sqlite");
if (!store.list().length)
  await store.create({
    name: "northstar_supply_october.csv",
    csv: demoCSV(),
    demo: true,
  });
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  const host = req.headers.host?.split(":")[0];
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host))
    return res
      .status(403)
      .json({ error: "This workspace is accessible on localhost only." });
  if (
    req.method !== "GET" &&
    req.headers.origin &&
    !["http://localhost:" + port, "http://127.0.0.1:" + port].includes(
      req.headers.origin,
    )
  )
    return res.status(403).json({ error: "Cross-origin writes are disabled." });
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use(express.json({ limit: "3mb" }));
const locks = new Set();
const mutation = (handler) => async (req, res, next) => {
  const key = req.params.id || "new";
  if (locks.has(key))
    return res
      .status(409)
      .json({
        error:
          "An operation is already running. Please retry after it completes.",
      });
  locks.add(key);
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  } finally {
    locks.delete(key);
  }
};
app.get("/api/workspace", (_req, res) =>
  res.json({
    runs: store.list(),
    schema: SCHEMA,
    integrations: integrationStatus(),
    scenarios: scenarios.map(({ csv, ...s }) => s),
  }),
);
app.post(
  "/api/settings/credentials",
  mutation(async (req, res) => {
    const { provider, key } = z
      .object({
        provider: z.enum(["NEATLOGS_API_KEY", "SARVAM_API_KEY"]),
        key: z
          .string()
          .min(16)
          .max(500)
          .regex(/^[A-Za-z0-9_.-]+$/),
      })
      .parse(req.body);
    if (provider === "NEATLOGS_API_KEY" && key.startsWith("nlw_"))
      return res
        .status(400)
        .json({ error: "Use the project API key, not the HTTP ingest key." });
    let content = existsSync(".env") ? readFileSync(".env", "utf8") : "";
    content = content
      .split("\n")
      .filter((line) => !line.startsWith(`${provider}=`))
      .join("\n");
    writeFileSync(".env", `${content.trim()}\n${provider}=${key}\n`, {
      mode: 0o600,
    });
    chmodSync(".env", 0o600);
    process.env[provider] = key;
    await setupTelemetry();
    res.json({ saved: true });
  }),
);
app.get("/api/runs/:id", (req, res) =>
  res.json(store.view(store.get(req.params.id))),
);
app.post(
  "/api/runs",
  mutation(async (req, res) => {
    const input = z
      .object({
        name: z.string().min(1).max(160),
        csv: z.string().min(1),
        demo: z.boolean().optional(),
      })
      .parse(req.body);
    const result = await workflow(
      "inspect-and-repair",
      "new-import",
      async (traceId) => {
        const result = await tool("inspect-transform-validate", () =>
          store.create({ ...input, demo: false }),
        );
        if (traceId) {
          const run = store.get(result.id);
          run.traceId = traceId;
          store.save(run);
          return store.view(run);
        }
        return result;
      },
    );
    res.status(201).json(result);
  }),
);
app.post(
  "/api/scenarios/:scenario",
  mutation(async (req, res) => {
    const scenario = scenarios.find((s) => s.id === req.params.scenario);
    if (!scenario)
      return res.status(404).json({ error: "Scenario not found." });
    res.json(
      await workflow("scenario-rescue", req.params.scenario, () =>
        tool("inspect-transform-validate", () =>
          store.create({
            name: scenario.id + ".csv",
            csv: scenario.csv,
            demo: true,
          }),
        ),
      ),
    );
  }),
);
app.post(
  "/api/demo",
  mutation(async (_req, res) => {
    const run = await store.create({
      name: "northstar_live_delivery.csv",
      csv: demoCSV({ firstOnly: true }),
      demo: true,
      phase: "before-drift",
    });
    res.json(store.commit(run.id));
  }),
);
app.post(
  "/api/runs/:id/drift",
  mutation(async (req, res) => {
    const run = store.get(req.params.id);
    if (!run.demo || run.phase !== "before-drift")
      return res
        .status(409)
        .json({ error: "Start a format-change demo first." });
    run.csv = demoCSV();
    run.phase = "after-drift";
    res.json(
      await workflow("repair-schema-drift", run.id, () =>
        tool("replan-and-validate", () => store.analyze(run)),
      ),
    );
  }),
);
app.post(
  "/api/runs/:id/commit",
  mutation(async (req, res) =>
    res.json(
      await workflow("commit-and-reconcile", req.params.id, () =>
        tool("sqlite-staging-transaction", () => store.commit(req.params.id)),
      ),
    ),
  ),
);
app.post(
  "/api/runs/:id/decision",
  mutation(async (req, res) => {
    const input = z
      .object({
        rows: z.array(z.number().int().positive()).min(1).max(10_000),
        action: z.enum(["keep", "quarantine"]),
      })
      .parse(req.body);
    const run = store.get(req.params.id);
    for (const number of input.rows) {
      const row = run.rows.find((r) => r.number === number);
      if (!row) throw new Error("Row not found.");
      if (
        input.action === "keep" &&
        !row.issues.some((i) => i.kind === "duplicate")
      )
        throw new Error(
          "Keep as repeat applies only to duplicate groups. Resolve other issues through mapping.",
        );
      run.decisions[number] = {
        action: input.action,
        at: new Date().toISOString(),
        actor: "operator",
      };
    }
    store.event(
      run,
      "Recorded operator decision",
      `${input.action === "keep" ? "Confirmed legitimate repeat" : "Quarantined"}: rows ${input.rows.join(", ")}.`,
      "decision",
    );
    res.json(
      await workflow("operator-decision", run.id, () =>
        tool("revalidate-decision", () => store.analyze(run)),
      ),
    );
  }),
);
app.post(
  "/api/runs/:id/mapping",
  mutation(async (req, res) => {
    const input = z
      .object({
        segment: z.number().int().positive(),
        target: z.enum(SCHEMA.map((s) => s.name)),
        source: z.string().min(1),
        operation: z.enum([
          "copy",
          "integer",
          "cents",
          "dollars_to_cents",
          "iso_date",
          "uppercase",
        ]),
      })
      .parse(req.body);
    const run = store.get(req.params.id);
    if (!run.plans.some((p) => p.id === input.segment))
      throw new Error("Schema segment not found.");
    if (store.staged(run.id).length)
      return res
        .status(409)
        .json({
          error:
            "A staged import is immutable. Start a new import to change its mappings.",
        });
    run.overrides[`${input.segment}:${input.target}`] = {
      source: input.source,
      operation: input.operation,
    };
    store.event(
      run,
      "Approved mapping",
      `${input.source} → ${input.target} (${input.operation}).`,
      "decision",
    );
    res.json(
      await workflow("repair-mapping", run.id, () =>
        tool("validate-approved-plan", () => store.analyze(run)),
      ),
    );
  }),
);
app.post(
  "/api/runs/:id/advise",
  mutation(async (req, res) => {
    const run = store.get(req.params.id);
    try {
      run.advisor = await workflow("mapping-advisor", run.id, (traceId) => {
        run.traceId = traceId;
        return advise(run.plans);
      });
      store.event(run, "Reviewed mapping", run.advisor.summary, "agent");
    } catch {
      store.event(
        run,
        "Model advisor unavailable",
        "Provider request failed. Local rules and unresolved decisions are preserved.",
        "error",
      );
      store.save(run);
      return res
        .status(502)
        .json({
          error:
            "Model advisor could not complete. The import and pending decisions are safe. Retry later.",
        });
    }
    store.save(run);
    res.json(store.view(run));
  }),
);
app.get("/api/runs/:id/export", (req, res) => {
  const run = store.get(req.params.id);
  if (req.query.format === "csv") {
    const cells = store.staged(run.id).map(({ run_id, row_number, ...r }) => r);
    res
      .attachment(`${run.id}-staged.csv`)
      .type("text/csv")
      .send(Papa.unparse(cells, { escapeFormulae: true }));
  } else res.attachment(`${run.id}-receipt.json`).json(store.view(run));
});
app.get("/api/business-plan", (_req, res) =>
  res.type("text/markdown").send(readFileSync("docs/business-plan.md", "utf8")),
);
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "API endpoint not found." }),
);
app.use((error, _req, res, _next) =>
  res
    .status(error.status || 400)
    .json({
      error:
        error instanceof z.ZodError
          ? error.issues.map((i) => i.message).join(" ")
          : error.message || "The operation could not complete.",
    }),
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 4173);
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`Import Rescue: http://localhost:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    server.close();
    await closeTelemetry();
    store.db.close();
    process.exit(0);
  });
