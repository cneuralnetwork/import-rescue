/*
 * A faithful client-side replay of the server's format-change fixture
 * (server/fixtures.js). The landing page animates these exact records so
 * every number it shows matches what the real engine produces.
 */
export const V1 = [
  "order_id",
  "sku",
  "quantity",
  "unit_price_usd",
  "currency",
  "ordered_at",
];
export const V2 = [
  "order_number",
  "product_code",
  "qty",
  "price_cents",
  "currency_code",
  "order_date",
];
export const DRIFT_AT = 65;
export const TOTAL = 128;
export const DUPLICATES: [number, number][] = [
  [8, 72],
  [23, 91],
  [41, 111],
];
export const QUARANTINED = [118, 125, 127];

export function record(i: number) {
  const original = i === 72 ? 8 : i === 91 ? 23 : i === 111 ? 41 : i;
  const cents = 450 + ((original * 137) % 8900);
  const quantity = i === 125 ? 0 : 1 + (original % 8);
  return {
    row: i,
    orderId: i === 118 ? "" : `PO-${1000 + original}`,
    sku: `A-${1100 + (original % 48)}`,
    quantity,
    cents,
    source: i >= DRIFT_AT ? String(cents) : (cents / 100).toFixed(2),
    date:
      i === 127
        ? "2026-02-30"
        : `2026-10-${String(1 + (original % 8)).padStart(2, "0")}`,
  };
}

export const pad = (n: number) => String(n).padStart(3, "0");

export function logLine(i: number) {
  const r = record(i);
  if (i === 118) return `record ${pad(i)} · order_id is empty · quarantined`;
  if (i === 125) return `record ${pad(i)} · quantity 0 · quarantined`;
  if (i === 127) return `record ${pad(i)} · 2026-02-30 is not a date · quarantined`;
  const dup = DUPLICATES.find(([, later]) => later === i);
  if (dup)
    return `record ${pad(i)} · ${r.orderId} repeats record ${pad(dup[0])} · held for review`;
  return i < DRIFT_AT
    ? `record ${pad(i)} · ${r.orderId} · ${r.source} USD → ${r.cents} ¢ · m-104`
    : `record ${pad(i)} · ${r.orderId} · ${r.source} ¢ kept · m-204`;
}
