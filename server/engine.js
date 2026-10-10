import Papa from "papaparse";
import { createHash } from "node:crypto";

export const SCHEMA = [
  {
    name: "order_id",
    type: "TEXT",
    required: true,
    description: "Supplier order identifier",
  },
  {
    name: "sku",
    type: "TEXT",
    required: true,
    description: "Product identifier",
  },
  {
    name: "quantity",
    type: "INTEGER",
    required: true,
    description: "Positive whole units",
  },
  {
    name: "price_cents",
    type: "INTEGER",
    required: true,
    description: "Unit price in USD cents",
  },
  {
    name: "currency",
    type: "TEXT",
    required: true,
    description: "USD only; no exchange-rate guessing",
  },
  {
    name: "ordered_at",
    type: "TEXT",
    required: true,
    description: "ISO calendar date, YYYY-MM-DD",
  },
];
const ALIASES = {
  order_id: ["order_id", "order_number", "order_no", "purchase_order"],
  sku: ["sku", "product_code", "item_sku", "product_sku"],
  quantity: ["quantity", "qty", "units"],
  price_cents: [
    "price_cents",
    "unit_price_cents",
    "unit_price_usd",
    "price_usd",
    "unit_price",
    "price",
    "amount",
  ],
  currency: ["currency", "currency_code"],
  ordered_at: ["ordered_at", "order_date", "date"],
};
const normalized = (s) => String(s).trim().toLowerCase().replace(/[ -]/g, "_");
export const fingerprint = (value) =>
  createHash("sha256").update(value).digest("hex");
// Treat only a complete, explicit destination-compatible header as a new segment.
// Partial header-like data must remain a record, never silently disappear.
const isHeader = (row) => {
  const cells = row.map(normalized);
  return SCHEMA.every((field) =>
    cells.some((cell) => ALIASES[field.name].includes(cell)),
  );
};

export function parseSource(csv) {
  if (typeof csv !== "string" || Buffer.byteLength(csv) > 2_000_000)
    throw new Error("CSV must be smaller than 2 MB.");
  const parsed = Papa.parse(csv.replace(/^\uFEFF/, ""), {
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });
  if (parsed.errors.length)
    throw new Error(`CSV could not be parsed: ${parsed.errors[0].message}`);
  if (parsed.data.length < 2)
    throw new Error("Include a header and at least one data row.");
  if (parsed.data.length > 10_010)
    throw new Error("A run can contain at most 10,000 data rows.");
  let headers, segment;
  const segments = [],
    records = [];
  parsed.data.forEach((values, index) => {
    if (index === 0 || isHeader(values)) {
      headers = values.map((s) => String(s).trim());
      if (
        headers.length > 40 ||
        headers.some((h) => !h || h.length > 120) ||
        new Set(headers.map(normalized)).size !== headers.length
      )
        throw new Error(
          "Headers must be unique, nonempty, and limited to 40 columns.",
        );
      segment = {
        id: segments.length + 1,
        startsAt: records.length + 1,
        headers,
        fingerprint: fingerprint(headers.join("|")).slice(0, 12),
      };
      segments.push(segment);
    } else {
      records.push({
        number: records.length + 1,
        sourceLine: index + 1,
        segment: segment.id,
        originalCells: values,
        raw: Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])),
        malformed: values.length !== headers.length,
      });
    }
  });
  if (!records.length || records.length > 10_000)
    throw new Error("Include between 1 and 10,000 data rows.");
  return { segments, records, sourceHash: fingerprint(csv) };
}

export function buildPlan(segments, overrides = {}) {
  return segments.map((segment) => {
    const rules = SCHEMA.map((field, index) => {
      const candidates = segment.headers.filter((h) =>
        ALIASES[field.name].includes(normalized(h)),
      );
      const override = overrides[`${segment.id}:${field.name}`];
      const source =
        override?.source ?? (candidates.length === 1 ? candidates[0] : null);
      if (source && !segment.headers.includes(source))
        throw new Error("Mapping must reference an existing source column.");
      let operation = "copy";
      if (field.name === "quantity") operation = "integer";
      if (field.name === "ordered_at") operation = "iso_date";
      if (field.name === "currency") operation = "uppercase";
      if (field.name === "price_cents") {
        operation =
          source && normalized(source).endsWith("_cents")
            ? "cents"
            : source && normalized(source).endsWith("_usd")
              ? "dollars_to_cents"
              : "needs_unit";
      }
      if (override?.operation) operation = override.operation;
      const allowed = {
        order_id: ["copy"],
        sku: ["copy"],
        quantity: ["integer"],
        price_cents: ["cents", "dollars_to_cents", "needs_unit"],
        currency: ["uppercase"],
        ordered_at: ["iso_date"],
      };
      if (!allowed[field.name].includes(operation))
        throw new Error("Unsupported transformation operation.");
      return {
        id: `m-${segment.id}${String(index + 1).padStart(2, "0")}`,
        source,
        target: field.name,
        operation,
        approved: Boolean(override),
        reason: !source
          ? candidates.length > 1
            ? "Multiple possible source columns. Choose one."
            : "Required field has no known source."
          : operation === "needs_unit"
            ? "The column does not declare dollars or cents."
            : override
              ? "Explicitly confirmed by the operator."
              : source === field.name
                ? "Destination column matched."
                : "Matched a documented supplier alias.",
      };
    });
    return {
      ...segment,
      rules,
      extraFields: segment.headers.filter(
        (h) => !rules.some((r) => r.source === h),
      ),
    };
  });
}

function integer(s) {
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n <= 1_000_000_000 ? n : null;
}
export function dollarsToCents(s) {
  // String arithmetic avoids floating-point rounding. Separators/locales are intentionally unresolved.
  const match = /^\$?(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!match) return null;
  const cents =
    Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= 1_000_000_000 ? cents : null;
}
function isoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const date = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === s
    ? s
    : null;
}

export function transform({ records, plans, decisions = {} }) {
  const rows = records.map((record) => {
    const plan = plans.find((p) => p.id === record.segment);
    const value = {},
      provenance = [],
      issues = [];
    if (record.malformed)
      issues.push({
        kind: "invalid",
        field: "*",
        message:
          "Row width differs from its header. Source values were retained.",
      });
    for (const rule of plan.rules) {
      const original = rule.source ? record.raw[rule.source] : null;
      const trimmed = String(original ?? "").trim();
      let result = trimmed;
      if (!rule.source) {
        result = null;
        issues.push({
          kind: "mapping",
          field: rule.target,
          message: rule.reason,
        });
      } else if (!trimmed) {
        result = null;
        issues.push({
          kind: "invalid",
          field: rule.target,
          message: `${rule.target} is empty.`,
        });
      } else if (rule.operation === "needs_unit") {
        result = null;
        issues.push({
          kind: "units",
          field: rule.target,
          message: "Dollars or cents? The source does not specify a unit.",
        });
      } else if (rule.operation === "integer" || rule.operation === "cents")
        result = integer(trimmed);
      else if (rule.operation === "dollars_to_cents")
        result = dollarsToCents(trimmed);
      else if (rule.operation === "iso_date") result = isoDate(trimmed);
      else if (rule.operation === "uppercase") result = trimmed.toUpperCase();
      if (
        result === null &&
        rule.source &&
        trimmed &&
        rule.operation !== "needs_unit"
      )
        issues.push({
          kind:
            rule.target === "ordered_at" &&
            /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(trimmed)
              ? "date"
              : "invalid",
          field: rule.target,
          message:
            rule.target === "ordered_at"
              ? "Date must be an unambiguous, valid ISO date."
              : `Value does not pass ${rule.operation} validation.`,
        });
      if (rule.target === "quantity" && result === 0)
        issues.push({
          kind: "invalid",
          field: rule.target,
          message: "Quantity must be greater than zero.",
        });
      if (rule.target === "currency" && result && result !== "USD")
        issues.push({
          kind: "currency",
          field: rule.target,
          message:
            "Only USD is supported. Currency conversion requires review.",
        });
      if (typeof result === "string" && result.length > 200)
        issues.push({
          kind: "invalid",
          field: rule.target,
          message: "Destination value exceeds 200 characters.",
        });
      value[rule.target] = result;
      provenance.push({
        field: rule.target,
        source: rule.source,
        before: original,
        after: result,
        rule: rule.id,
        operation: rule.operation,
        changed:
          rule.source !== rule.target || String(original) !== String(result),
        approval: rule.approved ? "operator" : "documented rule",
      });
    }
    const amountCents =
      value.currency === "USD" &&
      Number.isSafeInteger(value.price_cents) &&
      Number.isSafeInteger(value.quantity)
        ? value.price_cents * value.quantity
        : null;
    if (amountCents !== null && !Number.isSafeInteger(amountCents))
      issues.push({
        kind: "invalid",
        field: "price_cents",
        message: "Extended amount exceeds the safe integer range.",
      });
    return {
      ...record,
      value,
      provenance,
      issues,
      amountCents: Number.isSafeInteger(amountCents) ? amountCents : null,
    };
  });
  const groups = new Map();
  for (const row of rows) {
    if (!row.value.order_id || !row.value.sku || !row.value.ordered_at)
      continue;
    const key = JSON.stringify([
      row.value.order_id,
      row.value.sku,
      row.value.ordered_at,
    ]);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }
  for (const group of groups.values())
    if (group.length > 1)
      for (const row of group)
        row.issues.push({
          kind: "duplicate",
          field: "order_id",
          relatedRows: group.map((r) => r.number),
          message: `Rows ${group.map((r) => r.number).join(", ")} share an order, SKU, and date. A repeat or a duplicate?`,
        });
  for (const row of rows) {
    const decision = decisions[row.number];
    if (decision?.action === "keep")
      row.issues = row.issues.filter((i) => i.kind !== "duplicate");
    row.status =
      decision?.action === "quarantine" ||
      row.issues.some((i) => i.kind === "invalid")
        ? "Quarantined"
        : row.issues.length
          ? "Unresolved"
          : "Repaired";
    row.decision = decision || null;
  }
  return rows;
}

export function summarize(rows, staged = []) {
  const counts = {
    source: rows.length,
    repaired: 0,
    unresolved: 0,
    quarantined: 0,
    staged: staged.length,
  };
  for (const row of rows) counts[row.status.toLowerCase()]++;
  const sum = (list) =>
    list.reduce((total, r) => total + (r.amountCents ?? 0), 0);
  const sourceCents = sum(rows),
    stagedCents = staged.reduce((s, r) => s + r.price_cents * r.quantity, 0);
  const stagedNumbers = new Set(staged.map((r) => r.row_number));
  const held = rows.filter((r) => !stagedNumbers.has(r.number));
  const unknownAmounts = rows.filter(
    (r) => r.amountCents === null || r.value.currency !== "USD",
  ).length;
  const safeTotals = [sourceCents, stagedCents, sum(held)].every(
    Number.isSafeInteger,
  );
  const deltaCents = sourceCents - stagedCents - sum(held);
  const rowDelta = counts.source - counts.staged - held.length;
  return {
    counts,
    sourceCents,
    stagedCents,
    heldCents: sum(held),
    readyCents: sum(
      rows.filter(
        (r) => r.status === "Repaired" && !stagedNumbers.has(r.number),
      ),
    ),
    heldRows: held.length,
    unknownAmounts,
    safeTotals,
    deltaCents,
    rowDelta,
    balanced:
      rowDelta === 0 && deltaCents === 0 && unknownAmounts === 0 && safeTotals,
    complete:
      counts.unresolved === 0 &&
      counts.staged === counts.repaired &&
      counts.staged > 0,
  };
}
