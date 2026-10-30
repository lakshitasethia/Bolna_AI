"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReduced } from "./motion";
import styles from "./Steps.module.css";

const STEPS = [
  { name: "Call", line: "Rings every owner on your list at once, in Hindi or Hinglish" },
  { name: "Haggle", line: "Bargains in ₹500 steps and never names your maximum" },
  { name: "Book", line: "Locks the cheapest truck and sends you the vehicle and driver" },
  { name: "Follow up", line: "Calls the driver at pickup and tells you where the truck is" },
];

function CallPanel() {
  const rows = [
    ["Raju Yadav", "Okhla", "On the call"],
    ["Gurpreet Singh", "Kundli", "On the call"],
    ["Anwar Khan", "Gurugram", "Truck not free"],
  ];
  return (
    <div className={styles.sheet}>
      <p className={`${styles.sheetHead} mono`}>
        <span>Load 0417, Okhla to Jaipur</span>
        <span>3 owners</span>
      </p>
      <ul className={styles.owners}>
        {rows.map(([n, c, s]) => (
          <li key={n} data-row>
            <span className={styles.ring} data-on={s === "On the call"} />
            <strong>{n}</strong>
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

function HagglePanel() {
  const max = 38000;
  const lo = 33000;
  const hi = 43000;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const rows: [string, number][] = [
    ["Asked", 39000],
    ["Offered", 35000],
    ["Asked", 37500],
    ["Offered", 36000],
    ["Final", 36500],
  ];
  return (
    <div className={styles.sheet}>
      <p className={`${styles.sheetHead} mono`}>
        <span>Gurpreet Singh, 32 ft</span>
        <span>₹500 steps</span>
      </p>
      <div className={styles.ladder}>
        <i className={styles.max} style={{ left: pos(max) }}>
          <span className="mono">Your max ₹38,000</span>
        </i>
        {rows.map(([who, v], i) => (
          <div key={i} className={styles.bar} data-who={who} data-row>
            <span className="mono">{who}</span>
            <div>
              <i style={{ width: pos(v) }} data-fill />
            </div>
            <span>₹{v.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookPanel() {
  const rows = [
    ["Truck", "RJ14 GB 4521, 32 ft container"],
    ["Owner", "Gurpreet Singh, Kundli"],
    ["Driver", "Suresh, 98290 41234"],
    ["Rate", "₹36,500"],
    ["Under your max", "₹1,500"],
    ["Time to book", "2 min 48 s"],
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

function FollowPanel() {
  return (
    <div className={styles.sheet}>
      <p className={`${styles.sheetHead} mono`}>
        <span>Check call, 6:45 am</span>
        <span>Driver Suresh</span>
      </p>
      <ul className={styles.track}>
        <li data-done data-row>
          <span className="mono">6:40</span>Loaded at Okhla
        </li>
        <li data-done data-row>
          <span className="mono">8:15</span>Crossed Manesar
        </li>
        <li data-now data-row>
          <span className="mono">9:50</span>Past Neemrana
        </li>
        <li data-row>
          <span className="mono">13:00</span>Jaipur, expected
        </li>
      </ul>
    </div>
  );
}

const PANELS = [CallPanel, HagglePanel, BookPanel, FollowPanel];

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
          Bhaada fits into how you already work. You keep your owners, your rates and your shippers. It makes the calls,
          sticks to your budget and tells you what happened.
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
