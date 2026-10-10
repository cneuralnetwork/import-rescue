import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const origin = "http://localhost:4173";
async function call(path, body) {
  const r = await fetch(
    origin + "/api" + path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
}
const evidence = { at: new Date().toISOString(), checks: [] };
for (const scenario of [
  "schema-drift",
  "ambiguous-units",
  "duplicates",
  "invalid-records",
  "new-field",
]) {
  const r = await call("/scenarios/" + scenario, {});
  assert.equal(r.summary.counts.source, r.rows.length);
  assert.equal(
    r.rows.length,
    r.summary.counts.repaired +
      r.summary.counts.unresolved +
      r.summary.counts.quarantined,
  );
  evidence.checks.push({ scenario, runId: r.id, counts: r.summary.counts });
}
let r = await call("/demo", {});
assert.equal(r.summary.counts.staged, 64);
r = await call(`/runs/${r.id}/drift`, {});
assert.equal(r.summary.counts.staged, 61);
r = await call(`/runs/${r.id}/decision`, {
  rows: r.rows.filter((x) => x.status === "Unresolved").map((x) => x.number),
  action: "keep",
});
r = await call(`/runs/${r.id}/commit`, {});
assert.equal(r.summary.counts.staged, 125);
assert.equal(r.summary.balanced, true);
assert.equal(r.summary.complete, true);
assert.equal(r.summary.stagedCents, 2609808);
assert.equal(r.summary.heldCents, 125604);
const again = await call(`/runs/${r.id}/commit`, {});
assert.equal(again.summary.counts.staged, 125);
assert.equal(again.summary.stagedCents, r.summary.stagedCents);
const receipt = await call(`/runs/${r.id}/export`);
assert.equal(receipt.rows[0].provenance[3].before, "5.87");
assert.equal(receipt.rows[0].provenance[3].after, 587);
const cross = await fetch(origin + "/api/demo", {
  method: "POST",
  headers: {
    Origin: "https://untrusted.example",
    "Content-Type": "application/json",
  },
  body: "{}",
});
assert.equal(cross.status, 403);
evidence.demo = { runId: r.id, summary: r.summary };
evidence.checks.push(
  { check: "retry-idempotency", passed: true },
  { check: "provenance-export", passed: true },
  { check: "cross-origin-write-blocked", passed: true },
);
writeFileSync(
  "docs/evidence/api-smoke.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(JSON.stringify(evidence, null, 2));
