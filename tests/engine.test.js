import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSource,
  buildPlan,
  transform,
  dollarsToCents,
  summarize,
} from "../server/engine.js";
import { demoCSV, scenarios } from "../server/fixtures.js";
import { createStore } from "../server/store.js";
import { runSandbox } from "../server/sandbox.js";
const inspect = (csv) => {
  const p = parseSource(csv);
  return transform({ records: p.records, plans: buildPlan(p.segments) });
};
const header = "order_id,sku,quantity,price_cents,currency,ordered_at\n";

test("schema drift: both versions reconcile, with six ambiguous and three invalid rows", () => {
  const source = demoCSV(),
    parsed = parseSource(source),
    plans = buildPlan(parsed.segments);
  const rows = transform({ records: parsed.records, plans });
  assert.equal(plans.length, 2);
  assert.equal(plans[1].startsAt, 65);
  assert.equal(rows.length, 128);
  assert.equal(rows[0].value.price_cents, 587);
  assert.equal(rows[64].value.price_cents, 455 + 0); // row 65 wraps price at 8,900 cents
  assert.deepEqual(summarize(rows).counts, {
    source: 128,
    repaired: 119,
    unresolved: 6,
    quarantined: 3,
    staged: 0,
  });
  assert.equal(summarize(rows).balanced, true);
  assert.equal(
    rows[0].provenance.find((p) => p.field === "price_cents").before,
    "5.87",
  );
});
test("decimal currency is exact and ambiguous locales are never guessed", () => {
  assert.equal(dollarsToCents("19.99"), 1999);
  assert.equal(dollarsToCents("0.29"), 29);
  assert.equal(dollarsToCents("0.01"), 1);
  assert.equal(dollarsToCents("$4.5"), 450);
  for (const v of ["1,999", "19.999", "NaN", "Infinity", "-5", "1e4"])
    assert.equal(dollarsToCents(v), null);
});
test("undeclared units remain unresolved until explicit approval", () => {
  const p = parseSource(scenarios[1].csv);
  let rows = transform({ records: p.records, plans: buildPlan(p.segments) });
  assert.equal(rows[0].status, "Unresolved");
  assert.equal(summarize(rows).balanced, false);
  rows = transform({
    records: p.records,
    plans: buildPlan(p.segments, {
      "1:price_cents": { source: "price", operation: "cents" },
    }),
  });
  assert.equal(rows[0].value.price_cents, 1999);
  assert.equal(rows[0].status, "Repaired");
  assert.equal(rows[0].provenance[3].approval, "operator");
});
test("all duplicate candidates held; repeats require explicit decision", () => {
  const p = parseSource(scenarios[2].csv),
    plans = buildPlan(p.segments);
  const rows = transform({ records: p.records, plans });
  assert.equal(rows[0].status, "Unresolved");
  assert.equal(rows[1].status, "Unresolved");
  const allowed = transform({
    records: p.records,
    plans,
    decisions: { 1: { action: "keep" }, 2: { action: "keep" } },
  });
  assert.equal(allowed.filter((r) => r.status === "Repaired").length, 3);
});
test("invalid values quarantined and foreign currency never reconciled as USD", () => {
  const rows = inspect(scenarios[3].csv);
  assert.equal(rows.filter((r) => r.status === "Quarantined").length, 3);
  const foreign = inspect(header + "O-1,A-1,2,1200,EUR,2026-10-01");
  assert.equal(foreign[0].status, "Unresolved");
  assert.equal(foreign[0].amountCents, null);
  assert.equal(summarize(foreign).sourceCents, 0);
  assert.equal(summarize(foreign).balanced, false);
});
test("new fields remain retained; unsupported mapping code is rejected", () => {
  const p = parseSource(scenarios[4].csv),
    plans = buildPlan(p.segments);
  assert.deepEqual(plans[0].extraFields, ["supplier_charge", "warehouse"]);
  assert.equal(
    transform({ records: p.records, plans })[0].raw.warehouse,
    "East",
  );
  assert.throws(
    () =>
      buildPlan(p.segments, {
        "1:price_cents": { source: "supplier_charge", operation: "eval" },
      }),
    /Unsupported/,
  );
  assert.throws(
    () =>
      buildPlan(p.segments, {
        "1:price_cents": { source: "not_present", operation: "cents" },
      }),
    /existing source/,
  );
});
test("quoted cells, BOM, empty lines and malformed rows preserve source", () => {
  const rows = inspect(
    "\ufeff" +
      header +
      '"O,1",A-1,2,1200,USD,2026-10-01\n\nO-2,A-2,3,500,USD,2026-10-01,extra',
  );
  assert.equal(rows[0].value.order_id, "O,1");
  assert.equal(rows[1].status, "Quarantined");
  assert.equal(rows[1].originalCells[6], "extra");
  assert.throws(() => parseSource("a,a\nx,y"), /unique/);
  assert.throws(() => parseSource("a,b"), /at least/);
});
test("sandbox worker executes only validated declarative operations", async () => {
  const p = parseSource(scenarios[2].csv);
  const rows = await runSandbox({
    records: p.records,
    plans: buildPlan(p.segments),
  });
  assert.equal(rows.length, 3);
});
test("SQLite commit is idempotent and does not stage unresolved rows", async () => {
  const s = createStore(":memory:");
  try {
    const r = await s.create({ name: "sample.csv", csv: demoCSV() });
    const first = s.commit(r.id),
      second = s.commit(r.id);
    assert.equal(first.summary.counts.staged, 119);
    assert.equal(second.summary.counts.staged, 119);
    assert.equal(first.summary.stagedCents, second.summary.stagedCents);
    assert.equal(first.summary.deltaCents, 0);
    assert.equal(first.summary.balanced, true);
    assert.equal(
      first.summary.counts.source,
      first.summary.counts.staged + first.summary.heldRows,
    );
  } finally {
    s.db.close();
  }
});
test("mid-run drift retracts prior conflicting rows and resumes without double-counting", async () => {
  const s = createStore(":memory:");
  try {
    let r = await s.create({
      name: "live.csv",
      csv: demoCSV({ firstOnly: true }),
      demo: true,
    });
    assert.equal(s.commit(r.id).summary.counts.staged, 64);
    r = s.get(r.id);
    r.csv = demoCSV();
    let updated = await s.analyze(r);
    assert.equal(updated.summary.counts.staged, 61);
    assert.equal(updated.sourceHistory.length, 1);
    r = s.get(r.id);
    for (const row of r.rows.filter((row) => row.status === "Unresolved"))
      r.decisions[row.number] = { action: "keep", actor: "test" };
    await s.analyze(r);
    updated = s.commit(r.id);
    assert.equal(updated.summary.counts.staged, 125);
    assert.equal(updated.summary.balanced, true);
    assert.equal(updated.summary.complete, true);
    assert.equal(updated.summary.deltaCents, 0);
    assert.equal(s.commit(r.id).summary.counts.staged, 125);
  } finally {
    s.db.close();
  }
});

test("partial header-like values are retained as data instead of silently dropped", () => {
  const csv =
    "order_id,sku,quantity,price_cents,currency,ordered_at\norder_id,sku,quantity,500,USD,date\nPO-2,A-2,1,500,USD,2026-10-10";
  const parsed = parseSource(csv);
  assert.equal(parsed.records.length, 2);
  assert.equal(parsed.segments.length, 1);
  assert.equal(parsed.records[0].raw.order_id, "order_id");
});
