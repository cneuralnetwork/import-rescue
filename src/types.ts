export type Status = "Repaired" | "Unresolved" | "Quarantined" | "Reconciled";
export type Rule = {
  id: string;
  source: string | null;
  target: string;
  operation: string;
  reason: string;
  approved: boolean;
};
export type Plan = {
  id: number;
  startsAt: number;
  headers: string[];
  rules: Rule[];
  extraFields: string[];
  fingerprint: string;
};
export type Row = {
  number: number;
  sourceLine: number;
  originalCells: string[];
  malformed: boolean;
  segment: number;
  raw: Record<string, string>;
  value: Record<string, string | number | null>;
  status: Status;
  amountCents: number | null;
  provenance: {
    field: string;
    source: string | null;
    before: string | null;
    after: string | number | null;
    rule: string;
    operation: string;
    changed: boolean;
    approval: string;
  }[];
  issues: {
    kind: string;
    field: string;
    message: string;
    relatedRows?: number[];
  }[];
  decision: { action: string; at: string; actor: string } | null;
};
export type Summary = {
  counts: {
    source: number;
    repaired: number;
    unresolved: number;
    quarantined: number;
    staged: number;
  };
  sourceCents: number;
  stagedCents: number;
  heldCents: number;
  heldRows: number;
  readyCents: number;
  unknownAmounts: number;
  balanced: boolean;
  complete: boolean;
  safeTotals: boolean;
  deltaCents: number;
  rowDelta: number;
};
export type Run = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  demo: boolean;
  phase: string | null;
  sourceHash: string;
  sourceHistory: string[];
  plans: Plan[];
  rows: Row[];
  summary: Summary;
  staged: {
    row_number: number;
    order_id: string;
    sku: string;
    quantity: number;
    price_cents: number;
    currency: string;
    ordered_at: string;
  }[];
  events: {
    id: string;
    time: string;
    title: string;
    detail: string;
    kind: string;
  }[];
  traceId?: string;
  advisor: null | {
    mode: string;
    summary: string;
    suggestions: {
      segment: number;
      source: string;
      target: string;
      operation: string;
      reason: string;
    }[];
  };
};
export type Workspace = {
  runs: Pick<Run, "id" | "name" | "createdAt" | "demo" | "summary">[];
  schema: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  integrations: {
    neatlogs: string;
    model: string;
    neatlogsUrl: string;
    entireId: string | null;
    entireUrl: string | null;
    cfoUrl: string | null;
  };
  scenarios: { id: string; name: string; description: string }[];
};
