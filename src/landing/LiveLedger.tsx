import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Icon, Ticker, fmt, money } from "../ui";
import {
  DRIFT_AT,
  DUPLICATES,
  QUARANTINED,
  TOTAL,
  V1,
  V2,
  logLine,
  pad,
  record,
} from "./demo";

type Phase = "idle" | "scan1" | "drift" | "scan2" | "decide" | "done";
const EARLY = DUPLICATES.map(([a]) => a);
const LATE = DUPLICATES.map(([, b]) => b);
const STEP = 18;

function amount(i: number) {
  const r = record(i);
  return r.quantity * r.cents;
}

export function LiveLedger() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  const [filled, setFilled] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setFilled(TOTAL);
      setPhase("done");
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    (async () => {
      setFilled(0);
      setPhase("scan1");
      await wait(500);
      for (let i = 1; i < DRIFT_AT && !cancelled; i++) {
        setFilled(i);
        await wait(STEP);
      }
      if (cancelled) return;
      setPhase("drift");
      await wait(1700);
      setPhase("scan2");
      for (let i = DRIFT_AT; i <= TOTAL && !cancelled; i++) {
        setFilled(i);
        await wait(STEP);
      }
      await wait(1300);
      if (cancelled) return;
      setPhase("decide");
      await wait(1500);
      if (!cancelled) setPhase("done");
    })();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduce, run]);

  const committed = phase === "done";
  const decided = phase === "decide" || committed;
  function state(i: number) {
    if (i > filled) return "pending";
    if (QUARANTINED.includes(i)) return "quarantined";
    const lateReached = (n: number) => filled >= n && phase !== "scan1";
    const early = EARLY.indexOf(i);
    if (early >= 0 && lateReached(LATE[early]) && !decided) return "unresolved";
    if (LATE.includes(i) && !decided) return "unresolved";
    if (i < DRIFT_AT && !(early >= 0 && lateReached(LATE[early]) && !committed))
      return "staged";
    return committed ? "staged" : "repaired";
  }
  const states = Array.from({ length: TOTAL }, (_, k) => state(k + 1));
  const staged = states.filter((s) => s === "staged").length;
  const held = states.filter(
    (s) => s === "unresolved" || s === "quarantined",
  ).length;
  const stagedCents = states.reduce(
    (sum, s, k) => (s === "staged" ? sum + amount(k + 1) : sum),
    0,
  );

  const caption =
    phase === "idle"
      ? "Waiting for northstar_supply_october.csv"
      : phase === "drift"
        ? `record ${pad(DRIFT_AT)} · new header row · mapping rebuilt as version 2`
        : phase === "decide"
          ? "operator · keep 3 pairs as legitimate repeat orders"
          : phase === "done"
            ? "commit · 125 staged + 3 quarantined · Δ $0.00"
            : logLine(Math.max(1, filled));

  const block = (from: number) => (
    <div className="ledger-cells">
      {states.slice(from - 1, from + 63).map((s, k) => (
        <span
          key={from + k}
          className={`lcell ${s}`}
          title={`Record ${from + k}: ${s}`}
        />
      ))}
    </div>
  );

  return (
    <div className="ledger" ref={ref} aria-label="Animated replay of the format-change demo">
      <div className="ledger-head">
        <span className="mono">northstar_supply_october.csv</span>
        <span className="ledger-legend" aria-hidden="true">
          <i className="lcell staged" /> Staged
          <i className="lcell repaired" /> Repaired
          <i className="lcell unresolved" /> Held
          <i className="lcell quarantined" /> Quarantined
        </span>
        <button
          className="ledger-replay"
          onClick={() => setRun((r) => r + 1)}
          disabled={!committed}
          aria-label="Replay the import"
        >
          <Icon name="replay" />
          Replay
        </button>
      </div>
      <div className="ledger-row">
        <span className="ledger-ruler mono" aria-hidden="true">
          <span>001</span>
          <span>033</span>
        </span>
        {block(1)}
      </div>
      <motion.div
        className="ledger-seam"
        initial={false}
        animate={{
          height: phase === "idle" || phase === "scan1" ? 14 : "auto",
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence>
          {phase !== "idle" && phase !== "scan1" && (
            <motion.div
              className="seam-body"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <span className="seam-label mono">
                record {pad(DRIFT_AT)} · schema v2
              </span>
              <span className="seam-diff mono">
                {V1.map((h, k) => (
                  <span key={h}>
                    <del>{h}</del>
                    <span aria-hidden="true">→</span>
                    {V2[k]}
                  </span>
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="ledger-row">
        <span className="ledger-ruler mono" aria-hidden="true">
          <span>065</span>
          <span>097</span>
        </span>
        {block(DRIFT_AT)}
      </div>
      <div className="ledger-foot">
        <p className="ledger-log mono" aria-live="off">
          <span className={`log-dot ${phase}`} aria-hidden="true" />
          {caption}
        </p>
        <dl className="ledger-counts">
          <div>
            <dt>Source</dt>
            <dd>
              {fmt(filled)}
            </dd>
          </div>
          <div>
            <dt>Staged</dt>
            <dd>
              <Ticker value={staged} duration={0.5} />
            </dd>
          </div>
          <div>
            <dt>Held</dt>
            <dd className={held ? "is-held" : ""}>
              <Ticker value={held} duration={0.4} />
            </dd>
          </div>
          <div className="wide">
            <dt>Staged amount</dt>
            <dd>
              <Ticker value={stagedCents} format={money} duration={0.5} />
            </dd>
          </div>
        </dl>
      </div>
      <span className="sr-only">
        Final result: {fmt(TOTAL)} source records, 125 staged, 3 quarantined,
        $26,098.08 staged plus $1,256.04 held equals $27,354.12.
      </span>
    </div>
  );
}
