import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Icon, Tag } from "../ui";
import { V1, V2, record } from "./demo";

const csvLine = (i: number) => {
  const r = record(i);
  return [r.orderId, r.sku, r.quantity, r.source, "USD", r.date].join(",");
};

function InspectArtifact() {
  const lines: [string, string, string?][] = [
    ["1", V1.join(","), "head"],
    ["2", csvLine(1)],
    ["3", csvLine(2)],
    ["…", ""],
    ["64", csvLine(63)],
    ["65", csvLine(64)],
    ["66", V2.join(","), "drift"],
    ["67", csvLine(65)],
    ["68", csvLine(66)],
  ];
  return (
    <div className="art art-inspect">
      <div className="art-bar">
        <span className="mono">northstar_supply_october.csv</span>
        <span className="mono muted">130 lines · 2 headers</span>
      </div>
      <ol className="csv-lines mono">
        {lines.map(([n, text, kind]) => (
          <li key={n} className={kind}>
            <span className="ln">{n}</span>
            <span className="txt">{text}</span>
            {kind === "drift" && (
              <span className="flag">New schema at record 65</span>
            )}
          </li>
        ))}
      </ol>
      <div className="art-foot mono">
        <span>sha-256</span> 8f08f74d318e59a3e142…
        <span className="muted"> · original retained</span>
      </div>
    </div>
  );
}

function MapArtifact() {
  const rules: [string, string, string, string, boolean][] = [
    ["m-201", V2[0], "order_id", "Documented alias", false],
    ["m-202", V2[1], "sku", "Documented alias", false],
    ["m-203", V2[2], "quantity", "Validate whole number", false],
    ["m-204", V2[3], "price_cents", "Validate cents", false],
    ["m-205", V2[4], "currency", "Normalize currency", false],
    ["m-206", V2[5], "ordered_at", "Validate ISO date", false],
  ];
  return (
    <div className="art art-map">
      <div className="art-bar">
        <span>Version 2 · from record 65</span>
        <span className="mono muted">6 of 6 mapped</span>
      </div>
      <div className="map-compare">
        <div className="map-was">
          <span className="mono">v1 · m-104</span>
          <code>unit_price_usd</code>
          <span>Dollars → cents ×100</span>
        </div>
        <div className="map-now">
          <span className="mono">v2 · m-204</span>
          <code>price_cents</code>
          <span>Declared cents, kept as integer</span>
        </div>
      </div>
      <ul className="rule-rows">
        {rules.map(([id, from, to, op]) => (
          <li key={id}>
            <code>{from}</code>
            <span className="arrow" aria-hidden="true">
              →
            </span>
            <code className="to">{to}</code>
            <span className="op">{op}</span>
            <span className="mono id">{id}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DecideArtifact() {
  const [choice, setChoice] = useState<"keep" | "hold">("keep");
  const a = record(8),
    b = record(72);
  return (
    <div className="art art-decide">
      <div className="art-bar">
        <Tag status="Unresolved" />
        <span className="mono muted">2 rows · held together</span>
      </div>
      <h4>Duplicate records or legitimate repeat orders?</h4>
      <table className="pair mono">
        <thead>
          <tr>
            <th>record</th>
            <th>order_id</th>
            <th>sku</th>
            <th>qty</th>
            <th>source price</th>
            <th>date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>008</td>
            <td className="match">{a.orderId}</td>
            <td className="match">{a.sku}</td>
            <td>{a.quantity}</td>
            <td>{a.source} USD</td>
            <td className="match">{a.date}</td>
          </tr>
          <tr>
            <td>072</td>
            <td className="match">{b.orderId}</td>
            <td className="match">{b.sku}</td>
            <td>{b.quantity}</td>
            <td>{b.source} ¢</td>
            <td className="match">{b.date}</td>
          </tr>
        </tbody>
      </table>
      <div className="choice" role="radiogroup" aria-label="Try a decision">
        <button
          role="radio"
          aria-checked={choice === "keep"}
          onClick={() => setChoice("keep")}
        >
          <span className="radio" aria-hidden="true" />
          Keep as legitimate repeats
        </button>
        <button
          role="radio"
          aria-checked={choice === "hold"}
          onClick={() => setChoice("hold")}
        >
          <span className="radio" aria-hidden="true" />
          Quarantine both
        </button>
      </div>
      <p className="choice-result" aria-live="polite">
        {choice === "keep"
          ? "Both records stage. The decision, actor and time join each receipt."
          : "Both records leave staging. Originals and the decision stay in the ledger."}
      </p>
    </div>
  );
}

function ReceiptArtifact() {
  const r = record(12);
  const items: [string, string, string, string, string, boolean][] = [
    ["order_id", "order_id", r.orderId, r.orderId, "m-101", false],
    ["quantity", "quantity", String(r.quantity), String(r.quantity), "m-103", false],
    ["price_cents", "unit_price_usd", r.source, String(r.cents), "m-104", true],
    ["ordered_at", "ordered_at", r.date, r.date, "m-106", false],
  ];
  return (
    <div className="art art-receipt">
      <div className="art-bar">
        <span>Receipt · record 012</span>
        <Tag status="Repaired" />
      </div>
      <ul className="prov">
        {items.map(([field, src, before, after, id, changed]) => (
          <li key={field} className={changed ? "changed" : ""}>
            <div className="prov-head">
              <strong>{field}</strong>
              <span className="mono">{id}</span>
            </div>
            <div className="prov-ba mono">
              <span>
                <small>{src}</small>
                {changed ? <del>{before}</del> : before}
              </span>
              <Icon name="arrow" />
              <span>
                <small>destination</small>
                <b>{after}</b>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="art-foot mono">
        <span>Dollars → cents ×100 · documented rule</span>
      </div>
    </div>
  );
}

const chapters: { id: string; title: string; body: ReactNode; art: ReactNode }[] = [
  {
    id: "inspect",
    title: "Read the file as it arrived.",
    body: (
      <>
        Two header rows, one file. The source is fingerprinted and every record
        kept verbatim, malformed cells included. A complete new header at
        record 65 opens a second schema segment instead of being read as data.
      </>
    ),
    art: <InspectArtifact />,
  },
  {
    id: "map",
    title: "Only documented aliases move on their own.",
    body: (
      <>
        <code>order_number</code> becomes <code>order_id</code> because the
        alias is documented. A declared <code>_usd</code> price converts with
        exact decimal math. An unqualified <code>price</code> waits for you;
        nothing is inferred from magnitude.
      </>
    ),
    art: <MapArtifact />,
  },
  {
    id: "decide",
    title: "The agent stops where the evidence stops.",
    body: (
      <>
        Three late records share order, SKU and date with earlier ones. They
        could be duplicates or repeat orders, so both copies are held together
        and staging steps back from 64 to 61 until someone decides.
      </>
    ),
    art: <DecideArtifact />,
  },
  {
    id: "receipt",
    title: "Every changed value keeps its original.",
    body: (
      <>
        Each record carries its source column, the value before, the value
        after, the rule that ran and who approved it. The whole run downloads
        as one JSON receipt.
      </>
    ),
    art: <ReceiptArtifact />,
  },
];

function Chapter({
  index,
  active,
  onEnter,
}: {
  index: number;
  active: boolean;
  onEnter: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onEnter(index);
  }, [inView]);
  const c = chapters[index];
  return (
    <div ref={ref} className={`chapter ${active ? "active" : ""}`}>
      <span className="chapter-step mono">
        {String(index + 1).padStart(2, "0")} {c.id}
      </span>
      <h3>{c.title}</h3>
      <p>{c.body}</p>
      <div className="chapter-art-inline">{c.art}</div>
    </div>
  );
}

export function Chapters() {
  const [active, setActive] = useState(0);
  return (
    <div className="chapters">
      <div className="chapter-list">
        {chapters.map((c, i) => (
          <Chapter key={c.id} index={i} active={active === i} onEnter={setActive} />
        ))}
      </div>
      <div className="chapter-stage">
        <div className="stage-sticky">
          <div className="stage-progress">
            {chapters.map((c, i) => (
              <span key={c.id} className={i <= active ? "on" : ""} />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ y: 14 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {chapters[active].art}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
