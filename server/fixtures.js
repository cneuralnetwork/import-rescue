export function demoCSV({ drift = true, firstOnly = false } = {}) {
  const first = "order_id,sku,quantity,unit_price_usd,currency,ordered_at";
  const second =
    "order_number,product_code,qty,price_cents,currency_code,order_date";
  const rows = [first];
  for (let i = 1; i <= (firstOnly ? 64 : 128); i++) {
    if (i === 65 && drift) rows.push(second);
    let original = i;
    if (i === 72) original = 8;
    if (i === 91) original = 23;
    if (i === 111) original = 41;
    const cents = 450 + ((original * 137) % 8900);
    const price = i > 64 && drift ? String(cents) : (cents / 100).toFixed(2);
    rows.push(
      [
        i === 118 ? "" : `PO-${1000 + original}`,
        `A-${1100 + (original % 48)}`,
        i === 125 ? "0" : String(1 + (original % 8)),
        price,
        "USD",
        i === 127
          ? "2026-02-30"
          : `2026-10-${String(1 + (original % 8)).padStart(2, "0")}`,
      ].join(","),
    );
  }
  return rows.join("\n");
}
export const scenarios = [
  {
    id: "schema-drift",
    name: "Schema changes mid-file",
    description:
      "A new header arrives at row 65. Renamed columns and declared cents are repaired.",
    csv: demoCSV(),
  },
  {
    id: "ambiguous-units",
    name: "Dollars or cents?",
    description:
      "A price column has no declared unit. The agent asks before converting.",
    csv: "order_id,sku,quantity,price,currency,ordered_at\nPO-2001,A-1182,2,1999,USD,2026-10-08\nPO-2002,A-1190,3,450,USD,2026-10-08",
  },
  {
    id: "duplicates",
    name: "Duplicate or repeat order?",
    description:
      "Matching business keys are held together. Nothing is silently deduplicated.",
    csv: "order_id,sku,quantity,price_cents,currency,ordered_at\nPO-3001,A-1182,2,1999,USD,2026-10-08\nPO-3001,A-1182,2,1999,USD,2026-10-08\nPO-3002,A-1190,1,450,USD,2026-10-08",
  },
  {
    id: "invalid-records",
    name: "Invalid dates and values",
    description:
      "Missing IDs, negative quantities, and impossible dates are quarantined.",
    csv: "order_id,sku,quantity,price_cents,currency,ordered_at\n,A-1182,2,1999,USD,2026-10-08\nPO-4002,A-1190,-2,450,USD,2026-10-08\nPO-4003,A-1191,1,1250,USD,2026-02-30\nPO-4004,A-1192,3,900,USD,2026-10-08",
  },
  {
    id: "new-field",
    name: "Renamed or new field?",
    description:
      "An unrecognized charge field requires an explicit mapping. Extra fields stay in the receipt.",
    csv: "order_id,sku,quantity,supplier_charge,currency,ordered_at,warehouse\nPO-5001,A-1182,2,19.99,USD,2026-10-08,East\nPO-5002,A-1190,3,4.50,USD,2026-10-08,West",
  },
];
