import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Plan, Row, Rule, Run, Status, Workspace } from "./types";

const fmt = (n: number) => n.toLocaleString("en-US");
const money = (n: number) =>
  (n / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
const time = (s: string) =>
  new Date(s).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const operationLabel: Record<string, string> = {
  copy: "Copy value",
  integer: "Validate whole number",
  cents: "Validate cents",
  dollars_to_cents: "Dollars → cents ×100",
  needs_unit: "Unit needs confirmation",
  iso_date: "Validate ISO date",
  uppercase: "Normalize currency",
};
const glyph: Record<Status, string> = {
  Repaired: "●",
  Unresolved: "◆",
  Quarantined: "×",
  Reconciled: "✓",
};
function Tag({ status, children }: { status: Status; children?: ReactNode }) {
  return (
    <span className={`status ${status.toLowerCase()}`}>
      <span aria-hidden="true">{glyph[status]}</span>
      {children || status}
    </span>
  );
}
function Mark() {
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5H5v22h7M20 5h7v22h-7M11 16l4 4 8-9" />
    </svg>
  );
}
function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    imports: (
      <>
        <path d="M3 5h14M3 10h8M3 15h8M14 12v6m-3-3 3 3 3-3" />
      </>
    ),
    schema: (
      <>
        <path d="M3 3h5v5H3zM12 12h5v5h-5zM5.5 8v6.5H12M8 5.5h6.5V12" />
      </>
    ),
    staging: (
      <>
        <ellipse cx="10" cy="4.5" rx="7" ry="2.5" />
        <path d="M3 4.5v11c0 3.3 14 3.3 14 0v-11M3 10c0 3.3 14 3.3 14 0" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 2h10v16l-2-1-3 1-3-1-2 1V2ZM8 6h4M8 10h4" />
      </>
    ),
    search: (
      <>
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="m13 13 4 4" />
      </>
    ),
    plus: <path d="M10 4v12M4 10h12" />,
    arrow: <path d="M4 10h12m-5-5 5 5-5 5" />,
    upload: (
      <>
        <path d="M10 13V3m-4 4 4-4 4 4M3 12v5h14v-5" />
      </>
    ),
    download: (
      <>
        <path d="M10 3v10m-4-4 4 4 4-4M3 13v4h14v-4" />
      </>
    ),
    play: <path d="m6 3 10 7-10 7V3Z" />,
    settings: (
      <>
        <path d="M3 5h14M3 15h14" />
        <circle cx="7" cy="5" r="2" fill="var(--paper)" />
        <circle cx="13" cy="15" r="2" fill="var(--paper)" />
      </>
    ),
    close: <path d="m5 5 10 10M15 5 5 15" />,
    back: <path d="m12 4-6 6 6 6" />,
    check: <path d="m4 10 4 4 8-9" />,
  };
  return (
    <svg
      className="icon"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.receipt}
    </svg>
  );
}
async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(
    `/api${path}`,
    body === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null),
    [run, setRun] = useState<Run | null>(null);
  const [view, setView] = useState("Imports"),
    [tab, setTab] = useState("Data preview"),
    [filter, setFilter] = useState("All rows");
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<number | null>(null);
  const [upload, setUpload] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ir-theme") || "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ir-theme", theme);
  }, [theme]);
  async function refresh(id?: string) {
    const w = await api<Workspace>("/workspace");
    setWorkspace(w);
    if (id || w.runs[0]) setRun(await api<Run>(`/runs/${id || w.runs[0].id}`));
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  useEffect(() => setPage(0), [filter, search, run?.id]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  async function act(
    label: string,
    path: string,
    body: unknown = {},
    message?: string,
  ) {
    if (busy) return;
    setBusy(label);
    setError("");
    try {
      const r = await api<Run>(path, body);
      setRun(r);
      const w = await api<Workspace>("/workspace");
      setWorkspace(w);
      if (message) setNotice(message);
      return r;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function chooseRun(id: string) {
    setBusy("Loading import");
    setError("");
    try {
      setRun(await api<Run>(`/runs/${id}`));
      setSelected(null);
      setFilter("All rows");
      setView("Imports");
      setTab("Data preview");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  const navigate = (v: string) => {
    setView(v);
    setSelected(null);
  };
  const c = run?.summary.counts;
  const rows =
    run?.rows.filter(
      (r) =>
        (filter === "All rows" || r.status === filter) &&
        (search === "" ||
          JSON.stringify(r.raw).toLowerCase().includes(search.toLowerCase()) ||
          String(r.number) === search),
    ) || [];
  useEffect(
    () =>
      setPage((p) => Math.min(p, Math.max(0, Math.ceil(rows.length / 8) - 1))),
    [rows.length],
  );
  const selectedRow = run?.rows.find((r) => r.number === selected);
  const stagedNumbers = new Set(run?.staged.map((r) => r.row_number));
  const ready =
    run?.rows.filter(
      (r) => r.status === "Repaired" && !stagedNumbers.has(r.number),
    ).length || 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Imports");
          }}
        >
          <Mark />
          <span>
            Import Rescue
            <span className="brand-caption">The import ledger</span>
          </span>
        </a>
        <div className="workspace-name">
          <span className="workspace-monogram">IS</span>
          <div>
            ISeeData<span>Local workspace</span>
          </div>
          <span
            className="local-mark"
            title="Data stays in the local workspace"
          >
            ⌁
          </span>
        </div>
        <nav aria-label="Main navigation">
          {[
            ["Imports", "imports"],
            ["Destination schema", "schema"],
            ["Staging database", "staging"],
            ["Integrations", "settings"],
          ].map(([label, icon]) => (
            <button
              key={label}
              aria-label={
                label === "Imports"
                  ? `Imports ${workspace?.runs.length || 0}`
                  : label
              }
              aria-current={view === label ? "page" : undefined}
              className={`nav-item ${view === label ? "active" : ""}`}
              onClick={() => navigate(label)}
            >
              <Icon name={icon} />
              {label}
              {label === "Imports" && (
                <span className="nav-count">{workspace?.runs.length || 0}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-recents">
          <h2>Recent imports</h2>
          {workspace?.runs.slice(0, 4).map((r) => (
            <button
              key={r.id}
              className={`recent ${run?.id === r.id ? "chosen" : ""}`}
              onClick={() => chooseRun(r.id)}
            >
              <span
                className={`tiny-state ${r.summary.counts.unresolved ? "unresolved" : "repaired"}`}
              >
                {r.summary.counts.unresolved ? "◆" : "●"}
              </span>
              <span>
                {r.name}
                <small>
                  {fmt(r.summary.counts.source)} rows ·{" "}
                  {r.demo ? "Sample data" : "CSV upload"}
                </small>
              </span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="safety-note">
            <Icon name="check" />
            <span>
              Originals stay original.
              <br />
              <span>Every change has a receipt.</span>
            </span>
          </div>
          <button
            className="theme-button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <span className="theme-swatch" />
            {theme === "light"
              ? "Switch to dark paper"
              : "Switch to light paper"}
          </button>
          <div className="team-footer">
            <span>ISeeData</span>
            <span>neatHack 2026</span>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{view}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-indicator">Local staging</span>
            <button
              className="button primary small"
              onClick={() => setUpload(true)}
            >
              <Icon name="plus" />
              New import
            </button>
          </div>
        </header>
        <main>
          {error && (
            <div role="alert" className="error-banner">
              <strong>Could not complete the operation.</strong> {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <Icon name="close" />
              </button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <Icon name="check" />
              {notice}
            </div>
          )}
          {!run || !workspace ? (
            <div className="empty">
              <Mark />
              <h1>{error ? "Workspace unavailable" : "Opening the ledger"}</h1>
              <p>
                {error
                  ? "Check that the local server is running."
                  : "Reading the saved imports and staging database."}
              </p>
              {error && (
                <button
                  className="button"
                  onClick={() => refresh().catch((e) => setError(e.message))}
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <>
              {view === "Imports" && (
                <>
                  <div className="page-heading">
                    <div>
                      <h1>Import ledger</h1>
                      <p>Broken imports, repaired with receipts.</p>
                    </div>
                    <button
                      className="button text-button"
                      disabled={!!busy}
                      onClick={() =>
                        act(
                          "Starting demo",
                          "/demo",
                          {},
                          "First batch staged. Now change the supplier format.",
                        )
                      }
                    >
                      <Icon name="play" />
                      Run format-change demo
                    </button>
                  </div>
                  <section
                    className="import-context"
                    aria-label="Current import"
                  >
                    <div className="file-mark">
                      <Icon name="receipt" />
                    </div>
                    <div className="file-title">
                      <h2>{run.name}</h2>
                      <span>
                        {run.id}
                        <span className="middle-dot">·</span>
                        {run.demo ? "Synthetic supplier data" : "Uploaded CSV"}
                        <span className="middle-dot">·</span>
                        {new Date(run.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="destination">
                      <span>Destination</span>
                      <strong>
                        <Icon name="staging" />
                        supplier_orders
                      </strong>
                    </div>
                  </section>
                  {run.phase === "before-drift" && (
                    <div className="demo-callout">
                      <div>
                        <strong>
                          Batch 1 is in staging. Change the format mid-run.
                        </strong>
                        <p>
                          Batch 2 renames columns and switches dollars to cents.
                          It also exposes duplicate keys.
                        </p>
                      </div>
                      <button
                        className="button primary"
                        disabled={!!busy}
                        onClick={() =>
                          act(
                            "Detecting schema change",
                            `/runs/${run.id}/drift`,
                            {},
                            "Schema drift detected. Mapping repaired and conflicting rows held.",
                          )
                        }
                      >
                        Change supplier format
                        <Icon name="arrow" />
                      </button>
                    </div>
                  )}
                  <section className="metrics" aria-label="Import totals">
                    {[
                      ["Source rows", c!.source, "source", "All rows"],
                      ["Repaired", c!.repaired, "repaired", "Repaired"],
                      ["Unresolved", c!.unresolved, "unresolved", "Unresolved"],
                      [
                        "Quarantined",
                        c!.quarantined,
                        "quarantined",
                        "Quarantined",
                      ],
                    ].map(([label, value, kind, f]) => (
                      <button
                        className={`metric ${kind}`}
                        key={label}
                        onClick={() => {
                          setFilter(String(f));
                          setTab("Data preview");
                        }}
                        aria-label={`Filter ${label}`}
                      >
                        <span className="metric-label">
                          {kind !== "source" && (
                            <span aria-hidden="true">
                              {glyph[label as Status]}
                            </span>
                          )}
                          {label}
                        </span>
                        <strong>{fmt(Number(value))}</strong>
                        <span className="metric-explain">
                          {kind === "source"
                            ? "Every source row retained"
                            : kind === "repaired"
                              ? "Validated against destination"
                              : kind === "unresolved"
                                ? "Your decision is needed"
                                : "Held safely outside staging"}
                        </span>
                      </button>
                    ))}
                  </section>
                  <section
                    className="row-map"
                    aria-label="Source row status map"
                  >
                    <div className="row-map-top">
                      <span>
                        <strong>One square. One source row.</strong> Select any
                        row to see its receipt.
                      </span>
                      <span className="mono">
                        {fmt(c!.source)} / {fmt(c!.source)} accounted for
                      </span>
                    </div>
                    <div className="row-map-cells">
                      {run.rows.slice(0, 256).map((r) => (
                        <button
                          key={r.number}
                          title={`Row ${r.number}: ${r.status}`}
                          aria-label={`Inspect row ${r.number}, ${r.status}`}
                          className={`map-cell ${r.status.toLowerCase()} ${stagedNumbers.has(r.number) ? "staged" : ""}`}
                          onClick={() => setSelected(r.number)}
                        />
                      ))}
                    </div>
                    {run.rows.length > 256 && (
                      <small>
                        First 256 rows shown. All rows are available in the
                        table.
                      </small>
                    )}
                  </section>
                  <div className="workbench-grid">
                    <div className="workbench">
                      {c!.unresolved > 0 && (
                        <div className="decision-banner">
                          <span className="decision-symbol">◆</span>
                          <div>
                            <strong>
                              {fmt(c!.unresolved)} rows need a human decision.
                            </strong>
                            <span>
                              Ambiguity stays visible. Nothing gets silently
                              fixed.
                            </span>
                          </div>
                          <button
                            className="inline-action"
                            onClick={() => {
                              setFilter("Unresolved");
                              setTab("Decisions");
                            }}
                          >
                            Review decisions <Icon name="arrow" />
                          </button>
                        </div>
                      )}
                      <div
                        className="tabs"
                        role="tablist"
                        aria-label="Import details"
                      >
                        {[
                          "Data preview",
                          "Mapping",
                          "Decisions",
                          "Reconciliation",
                        ].map((t) => (
                          <button
                            role="tab"
                            id={`tab-${t.replaceAll(" ", "-")}`}
                            aria-controls="import-detail-panel"
                            tabIndex={tab === t ? 0 : -1}
                            aria-selected={tab === t}
                            onKeyDown={(e) => {
                              const names = [
                                "Data preview",
                                "Mapping",
                                "Decisions",
                                "Reconciliation",
                              ];
                              const index = names.indexOf(t);
                              const next =
                                e.key === "ArrowRight"
                                  ? (index + 1) % 4
                                  : e.key === "ArrowLeft"
                                    ? (index + 3) % 4
                                    : e.key === "Home"
                                      ? 0
                                      : e.key === "End"
                                        ? 3
                                        : null;
                              if (next !== null) {
                                e.preventDefault();
                                setTab(names[next]);
                                e.currentTarget.parentElement
                                  ?.querySelectorAll<HTMLButtonElement>(
                                    '[role="tab"]',
                                  )
                                  [next]?.focus();
                              }
                            }}
                            key={t}
                            onClick={() => setTab(t)}
                            className={tab === t ? "active" : ""}
                          >
                            {t}
                            {t === "Decisions" && c!.unresolved > 0 && (
                              <span>{c!.unresolved}</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div
                        role="tabpanel"
                        id="import-detail-panel"
                        aria-label={tab}
                        tabIndex={0}
                      >
                        {tab === "Data preview" && (
                          <section className="table-panel">
                            <div className="table-toolbar">
                              <div className="filters">
                                {[
                                  "All rows",
                                  "Repaired",
                                  "Unresolved",
                                  "Quarantined",
                                ].map((f) => (
                                  <button
                                    key={f}
                                    className={filter === f ? "selected" : ""}
                                    onClick={() => setFilter(f)}
                                  >
                                    {f}
                                  </button>
                                ))}
                              </div>
                              <label className="search">
                                <Icon name="search" />
                                <input
                                  aria-label="Search rows"
                                  placeholder="Find a value…"
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                />
                              </label>
                            </div>
                            <div className="table-scroll">
                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th className="numeric">Row</th>
                                    <th>order_id</th>
                                    <th>sku</th>
                                    <th className="numeric">qty</th>
                                    <th className="numeric">price_cents</th>
                                    <th>Status</th>
                                    <th>
                                      <span className="sr-only">Receipt</span>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows
                                    .slice(page * 8, page * 8 + 8)
                                    .map((row) => {
                                      const price = row.provenance.find(
                                        (p) => p.field === "price_cents",
                                      )!;
                                      return (
                                        <tr key={row.number}>
                                          <td className="numeric row-number">
                                            {row.number}
                                          </td>
                                          <td>
                                            {row.value.order_id || (
                                              <span className="missing">
                                                empty
                                              </span>
                                            )}
                                          </td>
                                          <td>{row.value.sku || "—"}</td>
                                          <td className="numeric">
                                            {row.value.quantity ?? "?"}
                                          </td>
                                          <td className="numeric">
                                            <div className="price-cell">
                                              {price.changed &&
                                                price.after !== null &&
                                                String(price.before) !==
                                                  String(price.after) && (
                                                  <del>{price.before}</del>
                                                )}
                                              <span
                                                className={
                                                  price.changed &&
                                                  price.after !== null
                                                    ? "changed-value"
                                                    : ""
                                                }
                                              >
                                                {price.after === null
                                                  ? "?"
                                                  : fmt(Number(price.after))}
                                              </span>
                                            </div>
                                          </td>
                                          <td>
                                            <Tag status={row.status} />
                                          </td>
                                          <td>
                                            <button
                                              className="row-action"
                                              aria-label={`View receipt for row ${row.number}`}
                                              onClick={() =>
                                                setSelected(row.number)
                                              }
                                            >
                                              <Icon name="arrow" />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                            {!rows.length && (
                              <div className="empty compact">
                                <h3>No matching rows</h3>
                                <p>
                                  Change the filter or search to see more
                                  records.
                                </p>
                                <button
                                  className="inline-action"
                                  onClick={() => {
                                    setFilter("All rows");
                                    setSearch("");
                                  }}
                                >
                                  Clear filters
                                </button>
                              </div>
                            )}
                            <div className="table-footer">
                              <span>
                                {rows.length
                                  ? `${fmt(page * 8 + 1)}–${fmt(Math.min(page * 8 + 8, rows.length))} of ${fmt(rows.length)} rows`
                                  : "0 rows"}
                                <span className="middle-dot">·</span>Changed
                                values include their source
                              </span>
                              <div className="pagination">
                                <button
                                  aria-label="Previous page"
                                  disabled={page === 0}
                                  onClick={() => setPage((p) => p - 1)}
                                >
                                  <Icon name="back" />
                                </button>
                                <span>
                                  {page + 1} /{" "}
                                  {Math.max(1, Math.ceil(rows.length / 8))}
                                </span>
                                <button
                                  aria-label="Next page"
                                  disabled={(page + 1) * 8 >= rows.length}
                                  onClick={() => setPage((p) => p + 1)}
                                >
                                  <Icon name="arrow" />
                                </button>
                              </div>
                            </div>
                          </section>
                        )}
                        {tab === "Mapping" && (
                          <Mapping run={run} busy={busy} act={act} />
                        )}
                        {tab === "Decisions" && (
                          <Decisions
                            run={run}
                            busy={busy}
                            act={act}
                            inspect={setSelected}
                            mapping={() => setTab("Mapping")}
                          />
                        )}
                        {tab === "Reconciliation" && (
                          <Reconciliation run={run} />
                        )}
                      </div>
                      <div className="commit-bar">
                        <div>
                          <strong>{fmt(ready)} rows ready for staging</strong>
                          <span>
                            {fmt(c!.unresolved + c!.quarantined)} held
                            separately · Originals preserved
                          </span>
                        </div>
                        <button
                          className="button primary"
                          disabled={!!busy || !ready}
                          onClick={() =>
                            act(
                              "Committing validated rows",
                              `/runs/${run.id}/commit`,
                              {},
                              "Validated rows committed. Reconciliation updated.",
                            )
                          }
                        >
                          {busy ||
                            (!ready && c!.staged
                              ? "Staging up to date"
                              : "Commit to staging")}
                          {!busy && <Icon name="arrow" />}
                        </button>
                      </div>
                    </div>
                    <aside className="receipt-rail">
                      <div className="rail-title">
                        <h2>Run receipt</h2>
                        <Icon name="receipt" />
                      </div>
                      <dl>
                        <div>
                          <dt>Source versions</dt>
                          <dd>{run.plans.length}</dd>
                        </div>
                        <div>
                          <dt>Destination</dt>
                          <dd>SQLite staging</dd>
                        </div>
                        <div>
                          <dt>Agent mode</dt>
                          <dd>
                            {workspace.integrations.model ===
                            "Local rule engine"
                              ? "Local rules"
                              : "Rules + model"}
                          </dd>
                        </div>
                        <div>
                          <dt>Rows staged</dt>
                          <dd>
                            {fmt(c!.staged)} / {fmt(c!.source)}
                          </dd>
                        </div>
                      </dl>
                      <div className="rail-total">
                        <span>Staged amount</span>
                        <strong>{money(run.summary.stagedCents)}</strong>
                        <span>
                          {run.summary.unknownAmounts
                            ? `${run.summary.unknownAmounts} source amounts need review`
                            : `${money(run.summary.heldCents)} held outside staging`}
                        </span>
                      </div>
                      <div className="rail-activity">
                        <h3>
                          Agent activity <span>{run.events.length}</span>
                        </h3>
                        {run.events
                          .slice(-3)
                          .reverse()
                          .map((e) => (
                            <div className="activity-mini" key={e.id}>
                              <span
                                className={`activity-glyph ${e.kind === "decision" ? "amber-text" : ""}`}
                              >
                                {e.kind === "decision" ? "◆" : "✓"}
                              </span>
                              <div>
                                <strong>{e.title}</strong>
                                <p>{e.detail}</p>
                                <time>{time(e.time)}</time>
                              </div>
                            </div>
                          ))}
                        <button
                          className="inline-action"
                          onClick={() => setTab("Activity")}
                        >
                          View full audit trail <Icon name="arrow" />
                        </button>
                      </div>
                      <div className="source-fingerprint">
                        <span>Original file fingerprint</span>
                        <code title={run.sourceHash}>
                          {run.sourceHash.slice(0, 24)}…
                        </code>
                        <small>SHA-256 · Source retained locally</small>
                      </div>
                      <a
                        className="receipt-download"
                        href={`/api/runs/${run.id}/export`}
                        download
                      >
                        <Icon name="download" />
                        Download receipt <span>.json</span>
                      </a>
                    </aside>
                  </div>
                  {tab === "Activity" && (
                    <section className="audit-panel">
                      <h2>Audit trail</h2>
                      <p>
                        Actual operations, recorded in order. All timestamps are
                        local.
                      </p>
                      <div className="audit-list">
                        {run.events.map((e) => (
                          <div key={e.id}>
                            <time>{time(e.time)}</time>
                            <strong>{e.title}</strong>
                            <p>{e.detail}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  <footer className="page-footer">
                    <span>Every changed value has provenance.</span>
                    <span>
                      {run.demo
                        ? "Sample data. Real transformations. Real SQLite."
                        : "Your data is stored in this local workspace."}
                    </span>
                  </footer>
                </>
              )}
              {view === "Destination schema" && (
                <>
                  <div className="page-heading">
                    <div>
                      <h1>Destination schema</h1>
                      <p>
                        One explicit contract. Every import is validated against
                        it.
                      </p>
                    </div>
                    <span className="mono">supplier_orders</span>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Supplier orders</h2>
                      <span>6 required fields · USD only</span>
                    </div>
                    <div className="table-scroll">
                      <table className="data-table schema-table">
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Validation</th>
                            <th>Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workspace.schema.map((f) => (
                            <tr key={f.name}>
                              <td>{f.name}</td>
                              <td>{f.type}</td>
                              <td>{f.description}</td>
                              <td>Yes</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <div className="info-columns">
                    <section>
                      <h2>Duplicates require context.</h2>
                      <p>
                        The same order, SKU, and date may be a legitimate
                        repeat. Every matching row is held for review until you
                        confirm it.
                      </p>
                    </section>
                    <section>
                      <h2>No silent conversions.</h2>
                      <p>
                        Undeclared monetary units, ambiguous dates, and
                        unsupported currencies stay Unresolved. Extra fields are
                        preserved in the source receipt.
                      </p>
                    </section>
                  </div>
                </>
              )}
              {view === "Staging database" && (
                <>
                  <div className="page-heading">
                    <div>
                      <h1>Staging database</h1>
                      <p>
                        Validated records from the selected import, read back
                        from SQLite.
                      </p>
                    </div>
                    <a
                      className="button"
                      href={`/api/runs/${run.id}/export?format=csv`}
                      download
                    >
                      <Icon name="download" />
                      Export staged CSV
                    </a>
                  </div>
                  <div className="stage-summary">
                    <strong>
                      {fmt(c!.staged)}
                      <span>staged rows</span>
                    </strong>
                    <strong>
                      {money(run.summary.stagedCents)}
                      <span>extended amount · USD</span>
                    </strong>
                    <div>
                      <span className="mono">{run.id}</span>
                      <p>{run.name}</p>
                    </div>
                  </div>
                  <section className="panel">
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {[
                              "row",
                              "order_id",
                              "sku",
                              "quantity",
                              "price_cents",
                              "currency",
                              "ordered_at",
                            ].map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {run.staged.map((r) => (
                            <tr key={r.row_number}>
                              <td>{r.row_number}</td>
                              <td>{r.order_id}</td>
                              <td>{r.sku}</td>
                              <td>{r.quantity}</td>
                              <td>{fmt(r.price_cents)}</td>
                              <td>{r.currency}</td>
                              <td>{r.ordered_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!c!.staged && (
                      <div className="empty">
                        <Icon name="staging" />
                        <h2>Nothing staged yet.</h2>
                        <p>
                          Review this import, then commit its validated rows.
                        </p>
                        <button
                          className="button primary"
                          onClick={() => navigate("Imports")}
                        >
                          Review import
                        </button>
                      </div>
                    )}
                  </section>
                </>
              )}
              {view === "Integrations" && (
                <Integrations
                  workspace={workspace}
                  run={run}
                  act={act}
                  busy={busy}
                />
              )}
            </>
          )}
        </main>
      </div>
      <Upload
        open={upload}
        close={() => setUpload(false)}
        workspace={workspace}
        busy={busy}
        error={error}
        submit={async (name, csv) => {
          const r = await act(
            "Inspecting CSV",
            "/runs",
            { name, csv },
            "CSV inspected. Review the transformation receipts.",
          );
          if (r) {
            setUpload(false);
            navigate("Imports");
            setTab("Data preview");
            setFilter("All rows");
          }
        }}
        scenario={async (id) => {
          const r = await act(
            "Running scenario",
            `/scenarios/${id}`,
            {},
            "Scenario inspected. All results come from the import engine.",
          );
          if (r) {
            setUpload(false);
            navigate("Imports");
            setTab(
              id === "ambiguous-units" || id === "new-field"
                ? "Mapping"
                : "Data preview",
            );
            setFilter("All rows");
          }
        }}
      />
      <Dialog.Root
        open={!!selectedRow}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="drawer">
            <Dialog.Title>Receipt for row {selectedRow?.number}</Dialog.Title>
            <Dialog.Description>
              Original values, applied rules, and the resulting record.
            </Dialog.Description>
            <Dialog.Close className="dialog-close" aria-label="Close receipt">
              <Icon name="close" />
            </Dialog.Close>
            {selectedRow && (
              <>
                <div className="drawer-meta">
                  <Tag status={selectedRow.status} />
                  <span className="mono">
                    CSV record {selectedRow.sourceLine} · v{selectedRow.segment}
                  </span>
                </div>
                {selectedRow.issues.length > 0 && (
                  <div
                    className={`issue-box ${selectedRow.status.toLowerCase()}`}
                  >
                    {selectedRow.issues.map((i, index) => (
                      <p key={index}>{i.message}</p>
                    ))}
                  </div>
                )}
                <div className="provenance-list">
                  {selectedRow.provenance.map((p) => (
                    <div key={p.field} className="provenance-item">
                      <div>
                        <strong>{p.field}</strong>
                        <span className="mono">{p.rule}</span>
                      </div>
                      <div className="before-after">
                        <div>
                          <span>Source · {p.source || "not mapped"}</span>
                          <code>
                            {p.before === null
                              ? "Not mapped"
                              : p.before === ""
                                ? "(empty)"
                                : p.before}
                          </code>
                        </div>
                        <Icon name="arrow" />
                        <div>
                          <span>Destination</span>
                          <code className={p.changed ? "changed-value" : ""}>
                            {p.after === null ? "Unresolved" : String(p.after)}
                          </code>
                        </div>
                      </div>
                      <p>
                        {operationLabel[p.operation]} · {p.approval}
                      </p>
                    </div>
                  ))}
                </div>
                <details className="raw-details">
                  <summary>View original source record</summary>
                  <pre>{JSON.stringify(selectedRow.raw, null, 2)}</pre>
                </details>
                {selectedRow.status === "Unresolved" && (
                  <button
                    className="button primary full"
                    onClick={() => {
                      setSelected(null);
                      setTab("Decisions");
                    }}
                  >
                    Review this decision
                  </button>
                )}
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {busy && (
        <div className="working-indicator" role="status">
          <span className="working-track" />
          {busy}
        </div>
      )}
    </div>
  );
}

type Act = (
  label: string,
  path: string,
  body?: unknown,
  message?: string,
) => Promise<Run | undefined>;
function Mapping({ run, busy, act }: { run: Run; busy: string; act: Act }) {
  return (
    <div className="mapping-panel">
      <div className="section-intro">
        <h2>
          {run.plans.length} source schema{run.plans.length === 1 ? "" : "s"},
          one destination.
        </h2>
        <p>
          Only documented aliases are automatic. You approve uncertain mappings.
        </p>
      </div>
      {run.plans.map((plan) => (
        <section className="mapping-version" key={plan.id}>
          <div className="mapping-header">
            <strong>Version {plan.id}</strong>
            <span>
              From row {plan.startsAt}
              <span className="middle-dot">·</span>
              <code>{plan.fingerprint}</code>
            </span>
          </div>
          {plan.rules.map((rule) => (
            <MappingRule
              key={rule.id}
              rule={rule}
              plan={plan}
              run={run}
              busy={busy}
              act={act}
            />
          ))}
          {plan.extraFields.length > 0 && (
            <p className="extra-fields">
              Retained in source only:{" "}
              <code>{plan.extraFields.join(", ")}</code>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
function MappingRule({
  rule,
  plan,
  run,
  busy,
  act,
}: {
  rule: Rule;
  plan: Plan;
  run: Run;
  busy: string;
  act: Act;
}) {
  const [source, setSource] = useState(
    rule.source || plan.extraFields[0] || plan.headers[0],
  );
  const [operation, setOperation] = useState(
    rule.operation === "needs_unit"
      ? "dollars_to_cents"
      : rule.target === "price_cents" && !rule.source
        ? "dollars_to_cents"
        : rule.operation,
  );
  const uncertain = !rule.source || rule.operation === "needs_unit";
  return (
    <div className={`mapping-rule ${uncertain ? "uncertain" : ""}`}>
      <div className="mapping-flow">
        <code>{rule.source || "Not mapped"}</code>
        <span>→</span>
        <code>{rule.target}</code>
        <span className="rule-op">{operationLabel[rule.operation]}</span>
        <span className={uncertain ? "amber-text" : "green-text"}>
          {uncertain ? "◆" : "✓"}
        </span>
      </div>
      {uncertain ? (
        <div className="mapping-approval">
          <p>{rule.reason}</p>
          <div>
            <label>
              Source column
              <select
                aria-label={`Source for ${rule.target}, version ${plan.id}`}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {plan.headers.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </label>
            {rule.target === "price_cents" && (
              <label>
                Source unit
                <select
                  aria-label={`Unit for version ${plan.id}`}
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                >
                  <option value="dollars_to_cents">
                    Dollars (multiply by 100)
                  </option>
                  <option value="cents">Cents (keep integer)</option>
                </select>
              </label>
            )}
            <button
              className="button primary small"
              disabled={!!busy}
              onClick={() =>
                act(
                  "Validating approved mapping",
                  `/runs/${run.id}/mapping`,
                  { segment: plan.id, target: rule.target, source, operation },
                  "Mapping approved and every affected row revalidated.",
                )
              }
            >
              Approve mapping
            </button>
          </div>
        </div>
      ) : (
        <span className="mapping-reason">{rule.reason}</span>
      )}
    </div>
  );
}
function Decisions({
  run,
  busy,
  act,
  inspect,
  mapping,
}: {
  run: Run;
  busy: string;
  act: Act;
  inspect: (n: number) => void;
  mapping: () => void;
}) {
  const seen = new Set<string>();
  const groups = run.rows
    .filter((r) => r.status === "Unresolved")
    .filter((r) => {
      const key =
        r.issues.find((i) => i.kind === "duplicate")?.relatedRows?.join(",") ||
        `${r.segment}:${r.issues.map((i) => i.kind + ":" + i.field).join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return (
    <section className="decision-list">
      <div className="section-intro">
        <h2>
          {groups.length
            ? `${groups.length} decision${groups.length === 1 ? "" : "s"} waiting for you.`
            : "No unresolved decisions."}
        </h2>
        <p>
          {groups.length
            ? "The agent stopped where the evidence stopped."
            : "All ambiguities have been addressed. Quarantined rows remain separate."}
        </p>
      </div>
      {groups.map((row) => {
        const duplicate = row.issues.find((i) => i.kind === "duplicate");
        const group =
          duplicate?.relatedRows?.filter(
            (n) =>
              run.rows.find((r) => r.number === n)?.status === "Unresolved",
          ) ||
          run.rows
            .filter(
              (r) =>
                r.status === "Unresolved" &&
                r.segment === row.segment &&
                r.issues.some((i) => i.kind === row.issues[0].kind),
            )
            .map((r) => r.number);
        return (
          <article className="decision-card" key={row.number}>
            <div className="decision-top">
              <Tag status="Unresolved" />
              <span>
                {group.length} {group.length === 1 ? "row" : "rows"} · Version{" "}
                {row.segment}
              </span>
            </div>
            <h3>
              {duplicate
                ? "Duplicate records or legitimate repeat orders?"
                : row.issues[0].message}
            </h3>
            <p>
              {duplicate
                ? duplicate.message
                : "The available source evidence is insufficient. Choose a mapping or hold these rows."}
            </p>
            <div className="decision-evidence">
              <code>{String(row.value.order_id || "No order ID")}</code>
              <span>Rows {group.join(", ")}</span>
              <button
                className="inline-action"
                onClick={() => inspect(row.number)}
              >
                Inspect source
              </button>
            </div>
            <div className="decision-actions">
              {duplicate ? (
                <button
                  className="button primary small"
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "Recording repeat-order decision",
                      `/runs/${run.id}/decision`,
                      { rows: group, action: "keep" },
                      "Confirmed as legitimate repeats. Records revalidated.",
                    )
                  }
                >
                  Keep as legitimate repeats
                </button>
              ) : (
                <button className="button primary small" onClick={mapping}>
                  Review mapping
                </button>
              )}
              <button
                className="button quiet small"
                disabled={!!busy}
                onClick={() =>
                  act(
                    "Quarantining rows",
                    `/runs/${run.id}/decision`,
                    { rows: group, action: "quarantine" },
                    "Rows quarantined. Original records and decisions retained.",
                  )
                }
              >
                Quarantine {group.length} {group.length === 1 ? "row" : "rows"}
              </button>
              {duplicate && group.length > 1 && (
                <button
                  className="inline-action"
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "Holding repeated copies",
                      `/runs/${run.id}/decision`,
                      { rows: group.slice(1), action: "quarantine" },
                      "Repeated copies held. Confirm the remaining original to stage it.",
                    )
                  }
                >
                  Hold repeated copies
                </button>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
function Reconciliation({ run }: { run: Run }) {
  const s = run.summary;
  return (
    <section className="reconciliation">
      <div className="section-intro">
        <h2>
          {s.complete && s.balanced
            ? "The ledger balances."
            : "Nothing goes unaccounted for."}
        </h2>
        <p>
          Source = staged + held. Amounts are quantity × unit price, in USD.
        </p>
      </div>
      <div className="reconcile-equation">
        <div>
          <span>Source rows</span>
          <strong>{fmt(s.counts.source)}</strong>
        </div>
        <span>=</span>
        <div>
          <span>Staged</span>
          <strong>{fmt(s.counts.staged)}</strong>
        </div>
        <span>+</span>
        <div>
          <span>Held</span>
          <strong>{fmt(s.heldRows)}</strong>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Check</th>
              <th className="numeric">Source</th>
              <th className="numeric">Staged</th>
              <th className="numeric">Held</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rows</td>
              <td className="numeric">{fmt(s.counts.source)}</td>
              <td className="numeric">{fmt(s.counts.staged)}</td>
              <td className="numeric">{fmt(s.heldRows)}</td>
            </tr>
            <tr>
              <td>Known amount</td>
              <td className="numeric">{money(s.sourceCents)}</td>
              <td className="numeric">{money(s.stagedCents)}</td>
              <td className="numeric">{money(s.heldCents)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="reconcile-result">
        <Tag status={s.balanced ? "Reconciled" : "Unresolved"} />
        <p>
          {s.balanced
            ? `Row delta: ${s.rowDelta}. Amount delta: ${money(s.deltaCents)}. All source rows are accounted for.`
            : !s.safeTotals
              ? "Totals exceed exact integer limits. Split the file before reconciling."
              : `${s.unknownAmounts} source amounts are unknown or not USD. Full financial reconciliation is pending.`}
        </p>
      </div>
      <p className="fine-print">
        A balanced ledger accounts for held rows; it does not certify that they
        are valid or that the entire file has been imported.
      </p>
    </section>
  );
}
function Integrations({
  workspace,
  run,
  act,
  busy,
}: {
  workspace: Workspace;
  run: Run;
  act: Act;
  busy: string;
}) {
  const i = workspace.integrations;
  const [provider, setProvider] = useState("NEATLOGS_API_KEY"),
    [key, setKey] = useState(""),
    [saving, setSaving] = useState(false),
    [result, setResult] = useState("");
  async function saveCredential() {
    setSaving(true);
    setResult("");
    try {
      await api("/settings/credentials", { provider, key });
      setKey("");
      setResult("Saved securely. Reloading connection status.");
      window.location.reload();
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Connected evidence</h1>
          <p>The agent, the build history, and the business behind it.</p>
        </div>
      </div>
      <section className="integration-list">
        <article>
          <div className="integration-name">
            neatlogs<span>Agent observability</span>
          </div>
          <div>
            <strong>{i.neatlogs}</strong>
            <p>
              Workflow and tool spans capture inspections, repairs, operator
              decisions, and staging. Raw CSV records stay local.
            </p>
            {run.traceId && <code>Latest trace: {run.traceId}</code>}
            <a href={i.neatlogsUrl} target="_blank" rel="noreferrer">
              Open neatlogs dashboard ↗
            </a>
          </div>
        </article>
        <article>
          <div className="integration-name">
            Entire<span>Build provenance</span>
          </div>
          <div>
            <strong>
              {i.entireId
                ? `Checkpoint ${i.entireId}`
                : "Repository connection pending"}
            </strong>
            <p>
              A checkpoint ties the implementation to the coding session and its
              decisions. An accessible checkpoint is required for submission.
            </p>
            <a
              href={i.entireUrl || "https://hack.entire.io/neathacks-2026/"}
              target="_blank"
              rel="noreferrer"
            >
              {i.entireUrl ? "View checkpoint" : "Open setup guide"} ↗
            </a>
          </div>
        </article>
        <article>
          <div className="integration-name">
            cfo.ai<span>Business planning</span>
          </div>
          <div>
            <strong>
              {i.cfoUrl
                ? "Business plan linked"
                : "Local draft ready; cfo.ai validation pending"}
            </strong>
            <p>
              Pricing, cost assumptions, and a 12-month runway model are
              prepared. Complete the plan in your cfo.ai account for submission
              evidence.
            </p>
            <a
              href={i.cfoUrl || "/api/business-plan"}
              target="_blank"
              rel="noreferrer"
            >
              {i.cfoUrl ? "View business plan" : "Read business-plan draft"} ↗
            </a>
          </div>
        </article>
      </section>
      <section className="advisor-panel">
        <div>
          <h2>Mapping advisor</h2>
          <p>
            {i.model}. Only headers are sent to the model. Suggestions never
            bypass review.
          </p>
        </div>
        <button
          className="button primary"
          disabled={!!busy}
          onClick={() =>
            act("Reviewing schema mappings", `/runs/${run.id}/advise`)
          }
        >
          Review current mapping
        </button>
        {run.advisor && (
          <div className="advisor-result">
            <h3>
              {run.advisor.mode === "model"
                ? "Model suggestions"
                : "Local rule review"}
            </h3>
            <p>{run.advisor.summary}</p>
            {run.advisor.suggestions.map((s, index) => (
              <p key={index}>
                <code>
                  {s.source} → {s.target}
                </code>{" "}
                · {s.reason}
              </p>
            ))}
          </div>
        )}
      </section>
      <section className="credential-panel">
        <h2>Connect a provider</h2>
        <p>
          Keys are saved to the local .env file with owner-only permissions.
          They are never returned to the browser or included in receipts.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCredential();
          }}
        >
          <label>
            Provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              aria-label="Credential provider"
            >
              <option value="NEATLOGS_API_KEY">neatlogs project API key</option>
              <option value="OPENAI_API_KEY">OpenAI API key</option>
            </select>
          </label>
          <label>
            API key
            <input
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-label="Provider API key"
              placeholder="Paste your key"
            />
          </label>
          <button className="button primary" disabled={saving || !key}>
            {saving ? "Saving…" : "Save locally"}
          </button>
        </form>
        {result && <p role="status">{result}</p>}
      </section>
      <p className="fine-print">
        Connection states reflect configuration, not proof of hosted delivery.
        Verify the exact trace, checkpoint, and cfo.ai plan before submission.
      </p>
    </>
  );
}
function Upload({
  open,
  close,
  workspace,
  busy,
  error,
  submit,
  scenario,
}: {
  open: boolean;
  close: () => void;
  workspace: Workspace | null;
  busy: string;
  error: string;
  submit: (name: string, csv: string) => Promise<void>;
  scenario: (id: string) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState(""),
    [csv, setCsv] = useState(""),
    [drag, setDrag] = useState(false),
    [localError, setLocalError] = useState("");
  async function read(file?: File) {
    if (!file) return;
    setLocalError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setLocalError("Choose a .csv file.");
      return;
    }
    if (file.size > 2_000_000) {
      setLocalError("Choose a file smaller than 2 MB.");
      return;
    }
    setFilename(file.name);
    setCsv(await file.text());
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="upload-dialog">
          <Dialog.Title>Give your import a second chance.</Dialog.Title>
          <Dialog.Description>
            Upload a supplier CSV. Review every repair before it reaches
            staging.
          </Dialog.Description>
          <Dialog.Close aria-label="Close new import" className="dialog-close">
            <Icon name="close" />
          </Dialog.Close>
          <div className="upload-layout">
            <img
              className="upload-art"
              src="/assets/ledger-still-life.png"
              alt="Ledger sheets, a green ruler, and a stamp"
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
            />
            <button
              className={`dropzone ${drag ? "drag-over" : ""}`}
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                read(e.dataTransfer.files[0]);
              }}
            >
              <Icon name="upload" />
              <strong>{filename || "Drop a CSV here"}</strong>
              <span>
                {filename
                  ? "Select a different file"
                  : "or click to choose a file"}
              </span>
              <small>Up to 2 MB · 10,000 rows · Kept locally</small>
            </button>
            <input
              className="sr-only"
              ref={input}
              type="file"
              accept=".csv,text/csv"
              aria-label="Choose CSV file"
              onChange={(e) => read(e.target.files?.[0])}
            />
          </div>
          <details className="paste-csv">
            <summary>Paste CSV instead</summary>
            <label>
              File name
              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="supplier.csv"
              />
            </label>
            <label>
              CSV content
              <textarea
                aria-label="CSV content"
                rows={5}
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="order_id,sku,quantity,price_cents,currency,ordered_at"
              />
            </label>
          </details>
          {(localError || error) && (
            <p className="form-error" role="alert">
              {localError || error}
            </p>
          )}
          <button
            className="button primary full"
            disabled={!!busy || !csv.trim()}
            onClick={() => submit(filename || "supplier.csv", csv)}
          >
            {busy || "Inspect import"}
            <Icon name="arrow" />
          </button>
          <div className="sample-heading">
            <h3>Or break something on purpose.</h3>
            <p>Five synthetic scenarios. The same real import engine.</p>
          </div>
          <div className="scenario-list">
            {workspace?.scenarios.map((s, index) => (
              <button
                key={s.id}
                disabled={!!busy}
                onClick={() => scenario(s.id)}
              >
                <span className="scenario-number">0{index + 1}</span>
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.description}</small>
                </span>
                <Icon name="arrow" />
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
