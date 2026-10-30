"use client";

import { useEffect, useRef, useState } from "react";
import { YardScene } from "./art";
import { gsap, prefersReduced } from "./motion";
import styles from "./UseCases.module.css";

const CASES = [
  { name: "Transporters", body: "Phone the load in once. Six agents work your owners while you handle your shippers." },
  { name: "Fleet owners", body: "Fill trucks that would otherwise wait at the yard, without hiring a dispatcher." },
  { name: "Freight brokers", body: "Run every load as a live auction across the owner network you already have." },
  { name: "Factory dispatch", body: "Book outbound trucks for the daily despatch without a morning of calls." },
  { name: "Small fleets", body: "Get the reach of a big control room from a one-person desk." },
  { name: "Dispatch teams", body: "Hand the repeat calls to Bhaada and keep people on the hard ones." },
];

// Where the sun sits behind the factory for each item, in the YardScene viewBox.
const SUN = [
  [430, 150],
  [170, 130],
  [300, 92],
  [520, 220],
  [90, 210],
  [360, 170],
];

export default function UseCases() {
  const [open, setOpen] = useState(0);
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sun = art.current?.querySelector("[data-sun]");
    if (!sun) return;
    const [cx, cy] = SUN[open];
    gsap.to(sun, { attr: { cx, cy }, duration: prefersReduced() ? 0 : 1.1, ease: "expo.out" });
  }, [open]);

  return (
    <section id="for" className={styles.section} aria-labelledby="for-title">
      <div className={styles.art} ref={art}>
        <div className={styles.sticky}>
          <YardScene />
          <p className={`${styles.coord} mono`}>
            <span>[{String(open + 1).padStart(2, "0")} / 06]</span>
            <span>{CASES[open].name}</span>
          </p>
        </div>
      </div>
      <div className={styles.list}>
        <div className={styles.head}>
          <p className={`${styles.label} mono`} data-scramble>
            Who it&apos;s for
          </p>
          <h2 id="for-title" className={styles.h2} data-lines>
            Made for the people on the phone
          </h2>
        </div>
        <ul>
          {CASES.map((c, i) => (
            <li key={c.name} data-open={open === i}>
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(i)}
                onMouseEnter={() => setOpen(i)}
                className={styles.item}
              >
                <span className={styles.name}>{c.name}</span>
                <span className={styles.toggle} aria-hidden />
              </button>
              <div className={styles.body}>
                <p>{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
