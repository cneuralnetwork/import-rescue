import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { Plan, Rule, Run, Status, Workspace } from "./types";
import {
  Icon,
  Mark,
  Tag,
  ThemeButton,
  Ticker,
  fmt,
  glyph,
  go,
  money,
  useTheme,
} from "./ui";
import "./workbench.css";

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
const TABS = [
  "Data preview",
  "Mapping",
  "Decisions",
  "Reconciliation",
  "Activity",
] as const;
const tabLabel: Record<string, string> = { Activity: "Audit trail" };
const PAGE = 10;

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

export default function Workbench() {
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
  const [theme, toggleTheme] = useTheme();
  useEffect(() => {
    document.title = "Import Rescue · The import ledger";
  }, []);
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
  // "N" opens a new import from anywhere outside a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        e.key.toLowerCase() !== "n" ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        t.closest("input, textarea, select, [contenteditable], [role=dialog]")
      )
        return;
      e.preventDefault();
      setUpload(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
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
      setPage((p) =>
        Math.min(p, Math.max(0, Math.ceil(rows.length / PAGE) - 1)),
      ),
    [rows.length],
  );
  const selectedRow = run?.rows.find((r) => r.number === selected);
  const stagedNumbers = new Set(run?.staged.map((r) => r.row_number));
  const ready =
    run?.rows.filter(
      (r) => r.status === "Repaired" && !stagedNumbers.has(r.number),
    ).length || 0;
  const seams = new Map(
    run?.plans.filter((p) => p.id > 1).map((p) => [p.startsAt, p.id]),
  );
  const nav: [string, string, string][] = [
    ["Imports", "imports", "Imports"],
    ["Destination schema", "schema", "Schema"],
    ["Staging database", "staging", "Staging"],
    ["Integrations", "settings", "Integrations"],
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="/app"
          onClick={(e) => {
            e.preventDefault();
            navigate("Imports");
          }}
        >
          <Mark size={24} />
          <span>Import Rescue</span>
        </a>
        <div className="workspace-name">
          <span className="workspace-monogram" aria-hidden="true">
            IS
          </span>
          <div>
            ISeeData<span>Local workspace</span>
          </div>
        </div>
        <nav aria-label="Main navigation">
          <LayoutGroup id="nav">
            {nav.map(([label, icon, short]) => (
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
                {view === label && (
                  <motion.span
                    layoutId="nav-active"
                    className="nav-active"
                    transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  />
                )}
                <Icon name={icon} />
                <span className="nav-label">{label}</span>
                <span className="nav-short" aria-hidden="true">
                  {short}
                </span>
                {label === "Imports" && (
                  <span className="nav-count">
                    {workspace?.runs.length || 0}
                  </span>
                )}
              </button>
            ))}
          </LayoutGroup>
        </nav>
        <div className="sidebar-recents">
          <h2>Recent imports</h2>
          {workspace?.runs.slice(0, 5).map((r) => (
            <button
              key={r.id}
              className={`recent ${run?.id === r.id ? "chosen" : ""}`}
              onClick={() => chooseRun(r.id)}
            >
              <span
                className={`tiny-state ${r.summary.counts.unresolved ? "unresolved" : "repaired"}`}
                aria-hidden="true"
              />
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
          <p className="safety-note">
            Originals stay original. Every change has a receipt.
          </p>
          <div className="sidebar-tools">
            <ThemeButton theme={theme} toggle={toggleTheme} />
            <a
              className="about-link"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                go("/");
              }}
            >
              About
            </a>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>ISeeData</span>
            <span aria-hidden="true">/</span>
            <strong>{view}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-indicator">
              <span aria-hidden="true" />
              Local staging
            </span>
            <ThemeButton theme={theme} toggle={toggleTheme} compact />
            <button
              className="button primary small"
              onClick={() => setUpload(true)}
              aria-keyshortcuts="N"
            >
              <Icon name="plus" />
              New import
              <kbd>N</kbd>
            </button>
          </div>
        </header>
        <main>
          {error && (
            <div role="alert" className="error-banner">
              <span>
                <strong>Could not complete the operation.</strong> {error}
              </span>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <Icon name="close" />
              </button>
            </div>
          )}
          {!run || !workspace ? (
            <div className="empty">
              <Mark size={36} />
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                className="view"
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.4, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
              {view === "Imports" && (
                <>
                  <div className="page-heading">
                    <div>
                      <h1>Import ledger</h1>
                      <p>Broken imports, repaired with receipts.</p>
                    </div>
                    <button
                      className="button"
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
                    <div className="file-title">
                      <Icon name="receipt" />
                      <div>
                        <h2>{run.name}</h2>
                        <span>
                          <code>{run.id}</code>
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
                    </div>
                    <div className="destination">
                      <span>Destination</span>
                      <strong>
                        <Icon name="staging" />
                        supplier_orders
                      </strong>
                    </div>
                  </section>
                  <AnimatePresence initial={false}>
                    {run.phase === "before-drift" && (
                      <motion.div
                        className="demo-callout"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="demo-callout-inner">
                          <span className="callout-step mono">Step 2 of 3</span>
                          <div>
                            <strong>
                              Batch 1 is in staging. Change the format mid-run.
                            </strong>
                            <p>
                              Batch 2 renames columns and switches dollars to
                              cents. It also exposes duplicate keys.
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
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        className={`metric ${kind} ${filter === f && tab === "Data preview" ? "selected" : ""}`}
                        key={label}
                        onClick={() => {
                          setFilter(String(f));
                          setTab("Data preview");
                        }}
                        aria-label={`Filter ${label}`}
                        aria-pressed={filter === f && tab === "Data preview"}
                      >
                        <span className="metric-label">
                          {kind !== "source" && (
                            <span aria-hidden="true" className="metric-glyph">
                              {glyph[label as Status]}
                            </span>
                          )}
                          {label}
                        </span>
                        <strong>
                          <Ticker value={Number(value)} />
                        </strong>
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
                        <strong>One square, one source row.</strong> Select any
                        square to open its receipt.
                      </span>
                      <span className="row-map-legend" aria-hidden="true">
                        <i className="map-cell repaired staged" /> Staged
                        <i className="map-cell repaired" /> Ready
                        <i className="map-cell unresolved" /> Decision
                        <i className="map-cell quarantined" /> Quarantined
                      </span>
                      <span className="mono row-map-count">
                        {fmt(c!.source)} / {fmt(c!.source)} accounted for
                      </span>
                    </div>
                    <div className="row-map-cells">
                      {run.rows.slice(0, 256).map((r, index) => (
                        <button
                          key={r.number}
                          title={`Row ${r.number}: ${r.status}${stagedNumbers.has(r.number) ? ", staged" : ""}`}
                          aria-label={`Inspect row ${r.number}, ${r.status}`}
                          data-seam={
                            seams.has(r.number)
                              ? `v${seams.get(r.number)}`
                              : undefined
                          }
                          style={{ transitionDelay: `${index * 2}ms` }}
                          className={`map-cell ${r.status.toLowerCase()} ${stagedNumbers.has(r.number) ? "staged" : ""} ${seams.has(r.number) ? "seam" : ""} ${selected === r.number ? "current" : ""}`}
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
                      <AnimatePresence initial={false}>
                        {c!.unresolved > 0 && tab !== "Decisions" && (
                          <motion.div
                            className="decision-banner"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div className="decision-banner-inner">
                              <span className="decision-symbol" aria-hidden="true">
                                ◆
                              </span>
                              <div>
                                <strong>
                                  {fmt(c!.unresolved)} rows need a human
                                  decision.
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div
                        className="tabs"
                        role="tablist"
                        aria-label="Import details"
                      >
                        <LayoutGroup id="tabs">
                          {TABS.map((t, index) => (
                            <button
                              role="tab"
                              id={`tab-${t.replaceAll(" ", "-")}`}
                              aria-controls="import-detail-panel"
                              tabIndex={tab === t ? 0 : -1}
                              aria-selected={tab === t}
                              onKeyDown={(e) => {
                                const n = TABS.length;
                                const next =
                                  e.key === "ArrowRight"
                                    ? (index + 1) % n
                                    : e.key === "ArrowLeft"
                                      ? (index + n - 1) % n
                                      : e.key === "Home"
                                        ? 0
                                        : e.key === "End"
                                          ? n - 1
                                          : null;
                                if (next !== null) {
                                  e.preventDefault();
                                  setTab(TABS[next]);
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
                              {tabLabel[t] || t}
                              {t === "Decisions" && c!.unresolved > 0 && (
                                <span className="tab-count">
                                  {c!.unresolved}
                                </span>
                              )}
                              {tab === t && (
                                <motion.span
                                  layoutId="tab-active"
                                  className="tab-indicator"
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 38,
                                  }}
                                />
                              )}
                            </button>
                          ))}
                        </LayoutGroup>
                      </div>
                      <div
                        role="tabpanel"
                        id="import-detail-panel"
                        aria-labelledby={`tab-${tab.replaceAll(" ", "-")}`}
                        tabIndex={0}
                        className="tab-panel"
                      >
                        {tab === "Data preview" && (
                          <section className="table-panel">
                            <div className="table-toolbar">
                              <div className="filters" role="group" aria-label="Filter rows">
                                {[
                                  "All rows",
                                  "Repaired",
                                  "Unresolved",
                                  "Quarantined",
                                ].map((f) => (
                                  <button
                                    key={f}
                                    className={filter === f ? "selected" : ""}
                                    aria-pressed={filter === f}
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
                                  placeholder="Find a value or row number…"
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
                                    .slice(page * PAGE, page * PAGE + PAGE)
                                    .map((row) => {
                                      const price = row.provenance.find(
                                        (p) => p.field === "price_cents",
                                      )!;
                                      return (
                                        <tr
                                          key={row.number}
                                          className="clickable"
                                          onClick={(e) => {
                                            if (
                                              !(e.target as HTMLElement).closest(
                                                "button",
                                              )
                                            )
                                              setSelected(row.number);
                                          }}
                                        >
                                          <td className="numeric row-number">
                                            {row.number}
                                            {stagedNumbers.has(row.number) && (
                                              <span
                                                className="staged-dot"
                                                title="In staging"
                                              />
                                            )}
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
                                  ? `${fmt(page * PAGE + 1)}–${fmt(Math.min(page * PAGE + PAGE, rows.length))} of ${fmt(rows.length)} rows`
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
                                <span className="mono">
                                  {page + 1} /{" "}
                                  {Math.max(1, Math.ceil(rows.length / PAGE))}
                                </span>
                                <button
                                  aria-label="Next page"
                                  disabled={(page + 1) * PAGE >= rows.length}
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
                        {tab === "Activity" && (
                          <section className="audit-panel">
                            <div className="section-intro">
                              <h2>Audit trail</h2>
                              <p>
                                Actual operations, recorded in order. All
                                timestamps are local.
                              </p>
                            </div>
                            <ol className="audit-list">
                              {run.events.map((e) => (
                                <li key={e.id} className={e.kind}>
                                  <time className="mono">{time(e.time)}</time>
                                  <span className="audit-glyph" aria-hidden="true">
                                    {e.kind === "decision" ? "◆" : "✓"}
                                  </span>
                                  <div>
                                    <strong>{e.title}</strong>
                                    <p>{e.detail}</p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </section>
                        )}
                      </div>
                      <div className="commit-bar">
                        <div>
                          <strong>
                            <Ticker value={ready} /> rows ready for staging
                          </strong>
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
                    <aside className="receipt-rail" aria-label="Run receipt">
                      <div className="rail-title">
                        <h2>Run receipt</h2>
                        <span className="mono">{run.id.slice(0, 12)}</span>
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
                        <strong>
                          <Ticker value={run.summary.stagedCents} format={money} />
                        </strong>
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
                                aria-hidden="true"
                              >
                                {e.kind === "decision" ? "◆" : "✓"}
                              </span>
                              <div>
                                <strong>{e.title}</strong>
                                <p>{e.detail}</p>
                                <time className="mono">{time(e.time)}</time>
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
                    <span className="mono heading-meta">supplier_orders</span>
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
                              <td>
                                <code>{f.name}</code>
                              </td>
                              <td>
                                <code className="type">{f.type}</code>
                              </td>
                              <td>{f.description}</td>
                              <td>
                                <span className="required">
                                  <Icon name="check" /> Yes
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <div className="info-columns">
                    <section>
                      <span className="info-glyph amber-text" aria-hidden="true">
                        ◆
                      </span>
                      <h2>Duplicates require context.</h2>
                      <p>
                        The same order, SKU, and date may be a legitimate
                        repeat. Every matching row is held for review until you
                        confirm it.
                      </p>
                    </section>
                    <section>
                      <span className="info-glyph rust-text" aria-hidden="true">
                        ×
                      </span>
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
                    <div>
                      <span>Staged rows</span>
                      <strong>
                        <Ticker value={c!.staged} />
                      </strong>
                    </div>
                    <div>
                      <span>Extended amount · USD</span>
                      <strong>
                        <Ticker value={run.summary.stagedCents} format={money} />
                      </strong>
                    </div>
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
                              <th
                                key={h}
                                className={
                                  ["row", "quantity", "price_cents"].includes(h)
                                    ? "numeric"
                                    : ""
                                }
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {run.staged.map((r) => (
                            <tr key={r.row_number}>
                              <td className="numeric row-number">
                                {r.row_number}
                              </td>
                              <td>{r.order_id}</td>
                              <td>{r.sku}</td>
                              <td className="numeric">{r.quantity}</td>
                              <td className="numeric">{fmt(r.price_cents)}</td>
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
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Main navigation, compact">
        {nav.map(([label, icon, short]) => (
          <button
            key={label}
            aria-current={view === label ? "page" : undefined}
            className={view === label ? "active" : ""}
            onClick={() => navigate(label)}
          >
            <Icon name={icon} />
            {short}
          </button>
        ))}
      </nav>
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
            <div className="drawer-head">
              <Dialog.Title>Receipt for row {selectedRow?.number}</Dialog.Title>
              <Dialog.Description>
                Original values, applied rules, and the resulting record.
              </Dialog.Description>
              <Dialog.Close className="dialog-close" aria-label="Close receipt">
                <Icon name="close" />
              </Dialog.Close>
            </div>
            {selectedRow && (
              <div className="drawer-body">
                <div className="drawer-meta">
                  <Tag status={selectedRow.status} />
                  {stagedNumbers.has(selectedRow.number) && (
                    <span className="drawer-staged">
                      <Icon name="staging" /> In staging
                    </span>
                  )}
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
                    <div
                      key={p.field}
                      className={`provenance-item ${p.changed ? "changed" : ""}`}
                    >
                      <div className="provenance-head">
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
                  <pre>
                    {JSON.stringify(
                      selectedRow.malformed
                        ? {
                            columns: selectedRow.raw,
                            originalCells: selectedRow.originalCells,
                          }
                        : selectedRow.raw,
                      null,
                      2,
                    )}
                  </pre>
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
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="toast-region" aria-live="polite">
        <AnimatePresence>
          {notice && (
            <motion.div
              key={notice}
              className="toast"
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <Icon name="check" />
              {notice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {busy && (
          <motion.div
            className="working-indicator"
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="working-track" />
            {busy}
          </motion.div>
        )}
      </AnimatePresence>
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
              key={`${run.id}:${rule.id}`}
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
          <strong>
            <Ticker value={s.counts.source} />
          </strong>
        </div>
        <i aria-hidden="true">=</i>
        <div>
          <span>Staged</span>
          <strong>
            <Ticker value={s.counts.staged} />
          </strong>
        </div>
        <i aria-hidden="true">+</i>
        <div>
          <span>Held</span>
          <strong className="held">
            <Ticker value={s.heldRows} />
          </strong>
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
              Open neatlogs dashboard <Icon name="external" />
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
              {i.entireUrl ? "View checkpoint" : "Open setup guide"} <Icon name="external" />
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
              {i.cfoUrl ? "View business plan" : "Read business-plan draft"} <Icon name="external" />
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
              <option value="SARVAM_API_KEY">Sarvam API key</option>
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
