"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReduced } from "./motion";
import styles from "./Steps.module.css";

const STEPS = [
  { name: "Call in", line: "You ring Bhaada once and say the load in Hindi" },
  { name: "Fan out", line: "Six agents dial six owners in the same minute" },
  { name: "Undercut", line: "Every rate one agent locks goes to the rest, who only book below it" },
  { name: "Book", line: "The cheapest truck wins and the details reach you" },
];

function IntakePanel() {
  const lines = [
    ["Bhaada", "Namaste, Bhaada desk. Load bataiye."],
    ["You", "Kal subah 6 baje Okhla se Jaipur, 32 foot container, 20 ton."],
    ["Bhaada", "Maximum kitna de sakte hain?"],
    ["You", "38 hazaar tak."],
    ["Bhaada", "Load post ho gaya. 6 gaadi waalon ko ek saath call kar rahi hoon."],
  ];
  return (
    <div className={styles.sheet}>
      <p className={`${styles.sheetHead} mono`}>
        <span>Incoming, Sharma Roadlines</span>
        <span>0:41</span>
      </p>
      <ul className={styles.track}>
        {lines.map(([who, text], i) => (
          <li key={i} data-row data-done={who === "You" ? "" : undefined}>
            <span className="mono">{who}</span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FanPanel() {
  const rows = [
    ["A", "Raju Yadav", "Okhla", "On the call"],
    ["B", "Gurpreet Singh", "Kundli", "On the call"],
    ["C", "Anwar Khan", "Gurugram", "Truck not free"],
    ["D", "Sukhwinder Gill", "Sonipat", "On the call"],
    ["E", "Vikram Chauhan", "Faridabad", "No answer"],
    ["F", "Mohan Lal", "Ghaziabad", "On the call"],
  ];
  return (
    <div className={styles.sheet}>
      <p className={`${styles.sheetHead} mono`}>
        <span>Load 0417, Okhla to Jaipur</span>
        <span>6 agents</span>
      </p>
      <ul className={styles.owners}>
        {rows.map(([a, n, c, s]) => (
          <li key={n} data-row>
            <span className={styles.ring} data-on={s === "On the call"} />
            <strong>
              <span className="mono">{a}</span> {n}
            </strong>
            <span>{c}</span>
            <span className="mono" data-on={s === "On the call"}>
              {s}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BoardPanel() {
  const rows: [string, string, boolean?][] = [
    ["+11s", "Agent A: Raju agreed ₹37,000"],
    ["+11s", "To B, D, F: only book under ₹37,000"],
    ["+14s", "Agent B: Gurpreet beat it with ₹36,000"],
    ["+16s", "Agent F: Mohan heard ₹36,000, took ₹35,500"],
    ["+17s", "Agent D: Sukhwinder wouldn't go under ₹35,500", true],
  ];
  return (
    <div className={styles.sheet}>
      <p className={`${styles.sheetHead} mono`}>
        <span>Agent channel</span>
        <span>Best ₹35,500</span>
      </p>
      <ul className={styles.track}>
        {rows.map(([t, text, now], i) => (
          <li key={i} data-row data-done={now ? undefined : ""} data-now={now ? "" : undefined}>
            <span className="mono">{t}</span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookPanel() {
  const rows = [
    ["Truck", "UP14 FT 9032, 32 ft container"],
    ["Owner", "Mohan Lal, Ghaziabad"],
    ["Driver", "Pappu, 97170 55620"],
    ["Rate", "₹35,500"],
    ["Under the first deal", "₹1,500"],
    ["Under your max", "₹2,500"],
  ];
  return (
    <div className={styles.sheet}>
      <p className={`${styles.sheetHead} mono`}>
        <span>Booking slip</span>
        <span>Load 0417</span>
      </p>
      <dl className={styles.slip}>
        {rows.map(([k, v]) => (
          <div key={k} data-row>
            <dt className="mono">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <span className={`${styles.stamp} mono`} data-stamp>
        Booked
      </span>
    </div>
  );
}

const PANELS = [IntakePanel, FanPanel, BoardPanel, BookPanel];

export default function Steps() {
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ active: 0, prev: -1 });
  const show = (i: number) => setView((v) => (v.active === i ? v : { active: i, prev: v.active }));

  // A new step wipes in over the last one behind an orange scanline, then its rows settle.
  useEffect(() => {
    if (view.prev < 0 || prefersReduced()) return;
    const el = frame.current!;
    const panel = el.querySelectorAll<HTMLElement>("[data-panel]")[view.active];
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "expo.inOut" } })
        .fromTo(panel, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75 }, 0)
        .fromTo("[data-scan]", { top: "0%", autoAlpha: 1 }, { top: "100%", duration: 0.75 }, 0)
        .to("[data-scan]", { autoAlpha: 0, duration: 0.2, ease: "none" })
        .from(panel.querySelectorAll("[data-row]"), { y: 10, autoAlpha: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" }, 0.25)
        .from(panel.querySelectorAll("[data-fill]"), { scaleX: 0, transformOrigin: "left center", duration: 0.7, stagger: 0.06, ease: "power3.out" }, 0.3)
        .from(panel.querySelectorAll("[data-stamp]"), { scale: 1.6, autoAlpha: 0, duration: 0.45, ease: "back.out(2)" }, 0.6);
    }, el);
    return () => ctx.revert();
  }, [view]);

  return (
    <section id="why" className={styles.section} aria-labelledby="why-title">
      <div className={styles.head}>
        <div>
          <p className={`${styles.label} mono`} data-scramble>
            Why Bhaada
          </p>
          <h2 id="why-title" className={styles.h2} data-lines>
            Built to work the way transporters do
          </h2>
        </div>
        <p className={styles.desc}>
          You keep your owners, your rates and your shippers. Bhaada takes one call from you, makes six at once, plays
          the owners&apos; rates against each other within your budget and tells you what happened.
        </p>
      </div>

      <div className={styles.stage}>
        <div className={styles.left}>
          <p className={`${styles.hint} mono`}>
            <span data-pointer="fine">Hover</span>
            <span data-pointer="touch">Tap</span> a step to see it work
          </p>
          <div className={styles.bars} role="tablist" aria-label="How Bhaada books a truck">
            {STEPS.map((s, i) => (
              <button
                key={s.name}
                type="button"
                role="tab"
                id={`step-${i}`}
                aria-selected={view.active === i}
                aria-controls={`step-panel-${i}`}
                className={styles.barItem}
                data-active={view.active === i ? "" : undefined}
                onMouseEnter={() => show(i)}
                onFocus={() => show(i)}
                onClick={() => show(i)}
              >
                <span className={`${styles.barNum} mono`}>[0{i + 1}]</span>
                <span className={styles.barName}>{s.name}</span>
                <span className={styles.barLine}>{s.line}</span>
                <i className={styles.barDot} />
              </button>
            ))}
          </div>
        </div>
        <div ref={frame} className={styles.frame}>
          <i className="plus" data-corner="tl" />
          <i className="plus" data-corner="br" />
          {PANELS.map((Panel, i) => (
            <div
              key={i}
              id={`step-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`step-${i}`}
              className={styles.panel}
              data-panel
              data-state={i === view.active ? "active" : i === view.prev ? "prev" : undefined}
            >
              <Panel />
            </div>
          ))}
          <i className={styles.scan} data-scan aria-hidden />
          <span className={`${styles.frameTag} mono`} aria-hidden>
            Step 0{view.active + 1} / 04
          </span>
        </div>
      </div>
    </section>
  );
}
