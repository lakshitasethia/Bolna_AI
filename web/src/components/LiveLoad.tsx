"use client";

import { useEffect, useState } from "react";
import { DEMO_CONTACTS, DEMO_LOAD } from "@/lib/demo.ts";
import { createLoad } from "@/lib/loads.ts";
import { inr } from "@/lib/negotiate.ts";
import { advance, startSim } from "@/lib/simulate.ts";
import type { Load } from "@/lib/types.ts";
import { CallCard } from "./CallCard";
import styles from "./LiveLoad.module.css";

// The hero runs the real negotiation rules in the browser, on a loop.
function freshLoad(now: number) {
  const load = createLoad({ ...DEMO_LOAD, contacts: DEMO_CONTACTS.slice(0, 2), mode: "sim" }, now);
  startSim(load, now + 900);
  return load;
}

export default function LiveLoad() {
  const [load, setLoad] = useState<Load | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = freshLoad(Date.now());
    if (reduce) {
      advance(current, Date.now() + 10 * 60_000);
      const frame = requestAnimationFrame(() => setLoad(structuredClone(current)));
      return () => cancelAnimationFrame(frame);
    }
    let doneAt: number | null = null;
    const tick = () => {
      const now = Date.now();
      advance(current, now);
      if (current.status !== "calling") {
        doneAt ??= now;
        if (now - doneAt > 7000) {
          current = freshLoad(now);
          doneAt = null;
        }
      }
      setLoad(structuredClone(current));
    };
    const frame = requestAnimationFrame(tick);
    const t = setInterval(tick, 250);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(t);
    };
  }, []);

  return (
    <div className={styles.window} aria-label="Bhaada booking a truck, live example">
      <p className={`${styles.chrome} mono`} aria-hidden>
        <span>Load 0417, live</span>
        <span>Simulated owners</span>
      </p>
      <h2 className={styles.title}>
        {DEMO_LOAD.from.split(",")[0]} to {DEMO_LOAD.to}
      </h2>
      <ul className={styles.facts}>
        <li>Kal, 6 am</li>
        <li>{DEMO_LOAD.truck}</li>
        <li>{DEMO_LOAD.weightTons} ton</li>
        <li>Max {inr(DEMO_LOAD.ceiling)}</li>
      </ul>

      <div className={styles.status} data-state={load?.status ?? "calling"}>
        {load?.status === "booked" && load.booking ? (
          <>
            Booked {load.booking.ownerName.split(" ")[0]} at {inr(load.booking.rate)}, {inr(load.booking.savedVsCeiling)}{" "}
            under your max
          </>
        ) : (
          <>Calling 2 truck owners</>
        )}
      </div>

      <div className={styles.calls}>{load?.calls.map((c) => <CallCard key={c.id} call={c} lines={2} />)}</div>
    </div>
  );
}
