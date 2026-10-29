"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    id: "before",
    nav: "Before pickup",
    title: "Every owner, called at once",
    body: "Post the load once. Bhaada phones the truck owners you already work with, asks if the truck is free, and bargains in ₹500 steps. It never goes past your maximum, because that rule is checked by our server, not left to the voice model.",
    next: false,
  },
  {
    id: "road",
    nav: "On the road",
    title: "Check calls, without you making them",
    body: "At pickup time Bhaada calls the driver and asks whether the truck is loaded and where it has reached. The answer shows up on your desk, ready to forward to the shipper.",
    next: true,
  },
  {
    id: "after",
    nav: "After delivery",
    title: "Empty trucks find their way home",
    body: "When a truck is empty in Jaipur, the owner calls Bhaada and says so in Hindi. Bhaada matches it to your open loads going back, so the truck doesn't sit idle.",
    next: true,
  },
] as const;

function Visual({ id }: { id: (typeof STEPS)[number]["id"] }) {
  if (id === "before") {
    return (
      <ol className={styles.ladder} aria-label="Example negotiation with one owner">
        <li data-who="owner">Gurpreet asks ₹39,000</li>
        <li data-who="agent">Bhaada offers ₹35,000</li>
        <li data-who="owner">Gurpreet asks ₹37,500</li>
        <li data-who="agent">Bhaada offers ₹36,000</li>
        <li data-who="owner">Gurpreet says ₹36,500, final</li>
        <li data-who="deal">Booked at ₹36,500, ₹1,500 under your max</li>
      </ol>
    );
  }
  if (id === "road") {
    return (
      <ul className={styles.chat} aria-label="Example check call with a driver">
        <li data-who="agent">Suresh ji, gaadi load ho gayi? Abhi kahan pahunche?</li>
        <li data-who="owner">Haan, 6:40 pe load hui. Abhi Neemrana cross kiya.</li>
        <li data-who="agent">Theek hai. Jaipur kab tak?</li>
        <li data-who="owner">Dopahar 1 baje tak.</li>
        <li data-who="note">Sent to shipper: loaded 6:40 am, past Neemrana, ETA 1 pm</li>
      </ul>
    );
  }
  return (
    <ul className={styles.chat} aria-label="Example inbound call for a return load">
      <li data-who="owner">Jaipur mein khaali hoon, Delhi wapas jaana hai.</li>
      <li data-who="agent">Kal subah Sitapura se Okhla ka load hai, 18 ton. ₹31,000 chalega?</li>
      <li data-who="owner">Chalega.</li>
      <li data-who="note">Return load matched in one call</li>
    </ul>
  );
}

export default function HowItWorks() {
  const [active, setActive] = useState<string>(STEPS[0].id);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    Object.values(refs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.section} id="how" aria-labelledby="how-title">
      <h2 id="how-title" className={styles.heading}>
        Bhaada works the phones before, during and after every trip.
      </h2>
      <div className={styles.grid}>
        <nav className={styles.nav} aria-label="Stages of a trip">
          <ol>
            {STEPS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={active === s.id ? "step" : undefined}>
                  {s.nav}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className={styles.steps}>
          {STEPS.map((s) => (
            <article
              key={s.id}
              id={s.id}
              ref={(el) => {
                refs.current[s.id] = el;
              }}
              className={styles.step}
            >
              <h3 className={styles.stepTitle}>
                {s.title}
                {s.next && <span className={styles.next}>Next up</span>}
              </h3>
              <p className={styles.body}>{s.body}</p>
              <div className={styles.window}>
                <Visual id={s.id} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
