import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import type { Status } from "./types";

export const fmt = (n: number) => n.toLocaleString("en-US");
export const money = (n: number) =>
  (n / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export const glyph: Record<Status, string> = {
  Repaired: "●",
  Unresolved: "◆",
  Quarantined: "×",
  Reconciled: "✓",
};

/* Client-side navigation between the landing page and the workbench. */
export function go(path: string) {
  if (location.pathname === path) return;
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}
export function usePath() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const sync = () => setPath(location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return path;
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("ir-theme");
      if (saved) return saved;
    } catch {
      /* storage unavailable: fall back to the system preference */
    }
    return matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0f110f" : "#f4f3ee");
    try {
      localStorage.setItem("ir-theme", theme);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
  }, [theme]);
  return [theme, () => setTheme(theme === "light" ? "dark" : "light")] as const;
}

export function ThemeButton({
  theme,
  toggle,
  compact,
}: {
  theme: string;
  toggle: () => void;
  compact?: boolean;
}) {
  const label = theme === "light" ? "Dark paper" : "Light paper";
  return (
    <button
      className={`theme-button ${compact ? "compact" : ""}`}
      onClick={toggle}
      aria-label={`Switch to ${label.toLowerCase()}`}
      title={`Switch to ${label.toLowerCase()}`}
    >
      <span className="theme-swatch" aria-hidden="true" />
      {!compact && <span>{label}</span>}
    </button>
  );
}

export function Tag({
  status,
  children,
}: {
  status: Status;
  children?: ReactNode;
}) {
  return (
    <span className={`status ${status.toLowerCase()}`}>
      <span aria-hidden="true">{glyph[status]}</span>
      {children || status}
    </span>
  );
}

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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

const paths: Record<string, ReactNode> = {
  imports: <path d="M3 5h14M3 10h8M3 15h8M14 12v6m-3-3 3 3 3-3" />,
  schema: <path d="M3 3h5v5H3zM12 12h5v5h-5zM5.5 8v6.5H12M8 5.5h6.5V12" />,
  staging: (
    <>
      <ellipse cx="10" cy="4.5" rx="7" ry="2.5" />
      <path d="M3 4.5v11c0 3.3 14 3.3 14 0v-11M3 10c0 3.3 14 3.3 14 0" />
    </>
  ),
  receipt: <path d="M5 2h10v16l-2-1-3 1-3-1-2 1V2ZM8 6h4M8 10h4" />,
  search: (
    <>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" />
    </>
  ),
  plus: <path d="M10 4v12M4 10h12" />,
  arrow: <path d="M4 10h12m-5-5 5 5-5 5" />,
  upload: <path d="M10 13V3m-4 4 4-4 4 4M3 12v5h14v-5" />,
  download: <path d="M10 3v10m-4-4 4 4 4-4M3 13v4h14v-4" />,
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
  external: <path d="M8 4H4v12h12v-4M11 3h6v6M17 3l-8 8" />,
  replay: <path d="M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5" />,
  home: <path d="M3 9.5 10 4l7 5.5V17h-5v-4.5H8V17H3V9.5Z" />,
};
export function Icon({ name }: { name: string }) {
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

/**
 * Tweens a number to its new value. The final value is always rendered for
 * screen readers and when motion is reduced, so nothing waits on animation.
 */
export function Ticker({
  value,
  format = fmt,
  duration = 0.9,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    const from = previous.current;
    previous.current = value;
    if (!node || reduce || from === value) {
      if (node) node.textContent = format(value);
      return;
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (node.textContent = format(Math.round(v))),
    });
    return () => controls.stop();
  }, [value, reduce]);
  return (
    <span className="ticker">
      <span ref={ref} aria-hidden="true">
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/* Counts up from zero once the element scrolls into view. */
export function CountUp({
  to,
  format = fmt,
  duration = 1.4,
}: {
  to: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (node.textContent = format(Math.round(v))),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);
  return (
    <span className="ticker">
      <span ref={ref} aria-hidden="true">
        {format(to)}
      </span>
      <span className="sr-only">{format(to)}</span>
    </span>
  );
}
