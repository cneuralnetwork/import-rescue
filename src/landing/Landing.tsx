import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { CountUp, Icon, Mark, ThemeButton, go, money, useTheme } from "../ui";
import { LiveLedger } from "./LiveLedger";
import { Chapters } from "./Chapters";
import "./landing.css";

const refusals: [string, string, string][] = [
  [
    "R-01",
    "Guess a unit from magnitude",
    "An unqualified price column waits for you to say dollars or cents.",
  ],
  [
    "R-02",
    "Deduplicate quietly",
    "Matching order, SKU and date are held together until someone decides.",
  ],
  [
    "R-03",
    "Show a model your rows",
    "The optional Sarvam advisor sees headers only. Its suggestions still need approval.",
  ],
  [
    "R-04",
    "Run generated code",
    "Plans hold allowlisted operations, executed in a worker with memory and time limits.",
  ],
  [
    "R-05",
    "Add unknown currencies",
    "Non-USD or unreadable amounts stay out of totals and block full reconciliation.",
  ],
  [
    "R-06",
    "Touch the original",
    "The source is fingerprinted and kept. Committing twice never inserts a row twice.",
  ],
];

const specs: [string, string][] = [
  ["Runtime", "Node 22.13 with its built-in SQLite. Binds to loopback."],
  ["Execution", "Constrained DSL in a worker. No credentials in its environment."],
  ["Staging", "Idempotent on (run_id, row_number). One transaction per write."],
  ["Money", "Integer cents, exact decimal parsing, unsafe ranges rejected."],
  ["Tracing", "neatlogs workflow and tool spans. Counts and IDs, never rows."],
  ["Advisor", "sarvam-105b, optional, structured output, schema-validated."],
];

const commands = ["npm ci", "cp .env.example .env", "npm run dev"];

function Nav({ theme, toggle }: { theme: string; toggle: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`lnav ${scrolled ? "scrolled" : ""}`}>
      <div className="lnav-inner">
        <a className="lbrand" href="/" aria-label="Import Rescue home">
          <Mark size={26} />
          <span>Import Rescue</span>
        </a>
        <nav aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#guardrails">Guardrails</a>
          <a href="#balance">Reconciliation</a>
          <a href="#run">Run it</a>
        </nav>
        <div className="lnav-actions">
          <ThemeButton theme={theme} toggle={toggle} compact />
          <button className="button primary small" onClick={() => go("/app")}>
            Open the ledger
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const lift = useTransform(scrollY, [0, 600], [0, -40]);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <motion.div className="hero-copy" style={{ y: lift }}>
        <h1 id="hero-title">
          The supplier changed the file at&nbsp;record&nbsp;65.
        </h1>
        <div className="hero-sub">
          <p>
            Import Rescue noticed, rebuilt the mapping, held the records it
            could not prove, and balanced the ledger to the cent. Every changed
            value keeps a receipt.
          </p>
          <div className="hero-actions">
            <button className="button primary large" onClick={() => go("/app")}>
              Open the ledger
              <Icon name="arrow" />
            </button>
            <a className="text-link" href="#how">
              Follow one record through
            </a>
          </div>
        </div>
      </motion.div>
      <LiveLedger />
      <p className="hero-note">
        Replaying the bundled synthetic fixture with the same records, rules and
        totals the engine produces.
      </p>
    </section>
  );
}

function Balance() {
  return (
    <section id="balance" className="lsection balance" aria-labelledby="balance-title">
      <div className="section-head">
        <h2 id="balance-title">Source equals staged plus held.</h2>
        <p>
          Not an estimate. Every source record ends in exactly one place, and
          amounts are summed in integer cents.
        </p>
      </div>
      <div className="equation" role="group" aria-label="Row reconciliation">
        <div>
          <strong>
            <CountUp to={128} />
          </strong>
          <span>source records</span>
        </div>
        <i aria-hidden="true">=</i>
        <div>
          <strong>
            <CountUp to={125} />
          </strong>
          <span>staged</span>
        </div>
        <i aria-hidden="true">+</i>
        <div>
          <strong className="rust">
            <CountUp to={3} duration={0.8} />
          </strong>
          <span>quarantined</span>
        </div>
      </div>
      <div className="equation money" role="group" aria-label="Amount reconciliation">
        <div>
          <strong>
            <CountUp to={2735412} format={money} />
          </strong>
        </div>
        <i aria-hidden="true">=</i>
        <div>
          <strong>
            <CountUp to={2609808} format={money} />
          </strong>
        </div>
        <i aria-hidden="true">+</i>
        <div>
          <strong className="rust">
            <CountUp to={125604} format={money} />
          </strong>
        </div>
      </div>
      <dl className="balance-checks">
        <div>
          <dt>Row delta</dt>
          <dd className="mono">0</dd>
        </div>
        <div>
          <dt>Amount delta</dt>
          <dd className="mono">$0.00</dd>
        </div>
        <div>
          <dt>Second commit</dt>
          <dd className="mono">+0 rows</dd>
        </div>
        <div>
          <dt>Quarantined because</dt>
          <dd>Empty order ID, zero quantity, February 30th</dd>
        </div>
      </dl>
    </section>
  );
}

function Run() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(commands.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the commands remain selectable */
    }
  }
  return (
    <section id="run" className="lsection run" aria-labelledby="run-title">
      <div className="run-grid">
        <div>
          <h2 id="run-title">Runs on your machine.</h2>
          <p>
            No account, no upload to a service. All five scenarios and the rule
            engine work without an API key. Your data stays in{" "}
            <code>data/staging.sqlite</code>.
          </p>
          <button className="button primary large" onClick={() => go("/app")}>
            Open the ledger
            <Icon name="arrow" />
          </button>
        </div>
        <div className="commands">
          <div className="commands-head">
            <span className="mono">Terminal · Node 22.13+</span>
            <button onClick={copy} className="copy">
              <Icon name={copied ? "check" : "receipt"} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <ol className="mono">
            {commands.map((c) => (
              <li key={c}>
                <span aria-hidden="true">$</span>
                {c}
              </li>
            ))}
          </ol>
          <p className="mono muted">→ http://localhost:4173</p>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [theme, toggle] = useTheme();
  useEffect(() => {
    document.title = "Import Rescue · Broken CSV imports, repaired with receipts";
  }, []);
  return (
    <div className="landing">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav theme={theme} toggle={toggle} />
      <main id="main">
        <Hero />

        <section id="how" className="lsection" aria-labelledby="how-title">
          <div className="section-head">
            <h2 id="how-title">Follow one record through.</h2>
            <p>
              Four moves, each one visible, each one reversible until you
              commit.
            </p>
          </div>
          <Chapters />
        </section>

        <section
          id="guardrails"
          className="lsection guardrails"
          aria-labelledby="guard-title"
        >
          <div className="section-head">
            <h2 id="guard-title">What it will not do.</h2>
            <p>
              Repair is easy to automate. Restraint is the product.
            </p>
          </div>
          <ul className="refusals">
            {refusals.map(([code, no, instead]) => (
              <li key={code}>
                <span className="mono code">{code}</span>
                <span className="no">
                  <span className="x" aria-hidden="true">
                    ×
                  </span>
                  {no}
                </span>
                <span className="instead">{instead}</span>
              </li>
            ))}
          </ul>
        </section>

        <Balance />

        <section className="lsection specs" aria-labelledby="spec-title">
          <div className="section-head">
            <h2 id="spec-title">Under the paper.</h2>
            <p>
              USD only, one destination, single user. Small on purpose, exact
              where it counts.
            </p>
          </div>
          <dl className="spec-grid">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Run />
      </main>
      <footer className="lfooter">
        <svg
          className="wordmark"
          viewBox="0 0 1000 150"
          role="img"
          aria-label="Import Rescue"
        >
          <text x="500" y="118" textAnchor="middle" textLength="980" lengthAdjust="spacing">
            Import Rescue
          </text>
        </svg>
        <div className="lfooter-row">
          <span>
            <Mark size={18} /> Built by ISeeData for neatHack 2026
          </span>
          <span>Synthetic demo data. Real transformations. Real SQLite.</span>
          <a href="/app" onClick={(e) => (e.preventDefault(), go("/app"))}>
            Open the ledger →
          </a>
        </div>
      </footer>
    </div>
  );
}
