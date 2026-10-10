import { init, trace, shutdown } from "neatlogs";
import { wrapOpenAI } from "neatlogs/openai";
import { createSarvamClient, reviewMappings } from "./advisor.js";

let enabled = false,
  client;
export async function setupTelemetry() {
  if (process.env.NEATLOGS_API_KEY && !enabled) {
    try {
      await init({
        apiKey: process.env.NEATLOGS_API_KEY,
        workflowName: "import-rescue",
        pii: "redact",
        registerShutdownHandlers: false,
      });
      enabled = true;
    } catch {
      console.warn(
        "Neatlogs initialization failed. Imports remain available; hosted tracing is unverified.",
      );
    }
  }
  const sarvam = createSarvamClient({ apiKey: process.env.SARVAM_API_KEY });
  client = sarvam && enabled ? wrapOpenAI(sarvam) : sarvam;
}
export const integrationStatus = () => ({
  neatlogs: enabled ? "Configured; verify hosted traces" : "Project key needed",
  model: client ? "Sarvam mapping advisor configured" : "Local rule engine",
  neatlogsUrl: process.env.NEATLOGS_DASHBOARD_URL || "https://app.neatlogs.com",
  entireId: process.env.ENTIRE_CHECKPOINT_ID || null,
  entireUrl: process.env.ENTIRE_CHECKPOINT_URL || null,
  cfoUrl: process.env.CFO_PLAN_URL || null,
});
export async function workflow(name, runId, fn) {
  if (!enabled) return fn(null);
  let result;
  await trace(
    {
      name,
      kind: "WORKFLOW",
      sessionId: runId,
      input: { operation: name, runId },
      attributes: {
        "neatlogs.workflow.name": "import-rescue",
        "import.run_id": runId,
      },
    },
    async (root) => {
      result = await fn(root.spanContext().traceId);
      root.setStatus({ code: 1 });
      return {
        operation: name,
        completed: true,
        counts: result?.summary?.counts || null,
      };
    },
  );
  return result;
}
export async function tool(name, fn) {
  if (!enabled) return fn();
  let result;
  await trace(
    { name, kind: "TOOL", input: { operation: name } },
    async (root) => {
      result = await fn();
      root.setStatus({ code: 1 });
      return {
        operation: name,
        completed: true,
        counts: result?.summary?.counts || null,
      };
    },
  );
  return result;
}
export async function advise(plans) {
  return reviewMappings(client, plans);
}
export async function closeTelemetry() {
  if (enabled) await shutdown();
}
