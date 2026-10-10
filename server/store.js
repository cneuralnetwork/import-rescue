import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { parseSource, buildPlan, summarize } from "./engine.js";
import { runSandbox } from "./sandbox.js";

export function createStore(path = "data/staging.sqlite") {
  if (path !== ":memory:") mkdirSync("data", { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, document TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS staging (run_id TEXT NOT NULL REFERENCES runs(id), row_number INTEGER NOT NULL, order_id TEXT NOT NULL, sku TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0), price_cents INTEGER NOT NULL CHECK(price_cents>=0), currency TEXT NOT NULL CHECK(currency='USD'), ordered_at TEXT NOT NULL, PRIMARY KEY(run_id,row_number));`);
  const save = (run) =>
    db
      .prepare(
        "INSERT INTO runs VALUES (?,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document",
      )
      .run(run.id, JSON.stringify(run));
  const get = (id) => {
    const row = db.prepare("SELECT document FROM runs WHERE id=?").get(id);
    if (!row)
      throw Object.assign(new Error("Import not found."), { status: 404 });
    return JSON.parse(row.document);
  };
  const staged = (id) =>
    db
      .prepare("SELECT * FROM staging WHERE run_id=? ORDER BY row_number")
      .all(id);
  const event = (run, title, detail, kind = "tool") =>
    run.events.push({
      id: randomUUID(),
      time: new Date().toISOString(),
      title,
      detail,
      kind,
    });
  const view = (run) => ({
    ...run,
    csv: undefined,
    summary: summarize(run.rows, staged(run.id)),
    staged: staged(run.id),
  });
  const list = () =>
    db
      .prepare("SELECT document FROM runs ORDER BY rowid DESC")
      .all()
      .map((r) => {
        const run = JSON.parse(r.document);
        return {
          id: run.id,
          name: run.name,
          createdAt: run.createdAt,
          demo: run.demo,
          summary: summarize(run.rows, staged(run.id)),
        };
      });
  async function analyze(run) {
    const parsed = parseSource(run.csv);
    const previousHash = run.sourceHash;
    run.sourceHash = parsed.sourceHash;
    run.plans = buildPlan(parsed.segments, run.overrides);
    event(
      run,
      "Inspected source",
      `${parsed.records.length} rows · ${parsed.segments.length} schema version${parsed.segments.length === 1 ? "" : "s"} · source SHA-256 recorded.`,
    );
    if (parsed.segments.length > 1)
      event(
        run,
        "Detected schema drift",
        `Header changed at row ${parsed.segments[1].startsAt}. Generated a separate mapping for each schema.`,
        "repair",
      );
    run.rows = await runSandbox({
      records: parsed.records,
      plans: run.plans,
      decisions: run.decisions,
    });
    // Previously staged rows made ambiguous by a later batch return to review atomically.
    const heldNumbers = new Set(
      run.rows.filter((r) => r.status !== "Repaired").map((r) => r.number),
    );
    const retracted = staged(run.id).filter((r) =>
      heldNumbers.has(r.row_number),
    );
    if (retracted.length)
      event(
        run,
        "Returned staged rows to review",
        `${retracted.length} earlier rows now conflict with the new batch. Their staging copies were retracted; source and audit history are retained.`,
        "decision",
      );
    const counts = summarize(run.rows).counts;
    event(
      run,
      "Validated transformation",
      `${counts.repaired} Repaired · ${counts.unresolved} Unresolved · ${counts.quarantined} Quarantined. Restricted worker completed.`,
      "check",
    );
    run.updatedAt = new Date().toISOString();
    if (previousHash && previousHash !== run.sourceHash)
      run.sourceHistory.push(previousHash);
    db.exec("BEGIN IMMEDIATE");
    try {
      save(run);
      for (const r of retracted)
        db.prepare("DELETE FROM staging WHERE run_id=? AND row_number=?").run(
          run.id,
          r.row_number,
        );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return view(run);
  }
  async function create({ name, csv, demo = false, phase = null }) {
    parseSource(csv);
    const run = {
      id: `IR-${randomUUID().slice(0, 8).toUpperCase()}`,
      name,
      csv,
      demo,
      phase,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      overrides: {},
      decisions: {},
      events: [],
      sourceHistory: [],
      rows: [],
      plans: [],
      advisor: null,
    };
    return analyze(run);
  }
  function commit(id) {
    const run = get(id),
      ready = run.rows.filter((r) => r.status === "Repaired");
    if (!ready.length)
      throw Object.assign(new Error("No validated rows are ready to stage."), {
        status: 409,
      });
    if (!summarize(run.rows, staged(id)).safeTotals)
      throw new Error(
        "Totals exceed the safe integer range. Split the file before staging.",
      );
    db.exec("BEGIN IMMEDIATE");
    try {
      const insert = db.prepare(
        "INSERT OR IGNORE INTO staging VALUES (?,?,?,?,?,?,?,?)",
      );
      let inserted = 0;
      for (const row of ready) {
        const v = row.value;
        inserted += Number(
          insert.run(
            id,
            row.number,
            v.order_id,
            v.sku,
            v.quantity,
            v.price_cents,
            v.currency,
            v.ordered_at,
          ).changes,
        );
      }
      event(
        run,
        "Committed to staging",
        `${inserted} new rows written in one SQLite transaction. ${ready.length - inserted} already-staged rows skipped.`,
        "check",
      );
      save(run);
      db.exec("COMMIT");
      return view(run);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return { db, get, save, list, view, create, analyze, commit, event, staged };
}
