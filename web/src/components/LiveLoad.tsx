"use client";

import { useEffect, useState } from "react";
import { DEMO_CONTACTS, DEMO_LOAD } from "@/lib/demo.ts";
import { createLoad } from "@/lib/loads.ts";
import { inr } from "@/lib/negotiate.ts";
import { advance, startSim } from "@/lib/simulate.ts";
import type { Call, Load } from "@/lib/types.ts";
import { Board } from "./Board";
import { StatusChip } from "./CallCard";
import styles from "./LiveLoad.module.css";

// Runs the real negotiation rules and agent channel in the browser, on a loop.
function freshLoad(now: number) {
  const load = createLoad({ ...DEMO_LOAD, contacts: DEMO_CONTACTS, mode: "sim" }, now);
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
        <span>Load 0417, phoned in</span>
        <span>6 agents, simulated owners</span>
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
            Booked {load.booking.ownerName.split(" ")[0]} at {inr(load.booking.rate)},{" "}
            {inr(load.booking.savedVsFirst)} under the first truck that agreed
          </>
        ) : (
          <>6 agents calling at once</>
        )}
      </div>

      <ul className={styles.calls}>{load?.calls.map((c) => <Row key={c.id} call={c} />)}</ul>
      {load && (
        <div className={styles.board}>
          <Board events={load.board} start={load.createdAt} limit={4} />
        </div>
      )}
    </div>
  );
}

function Row({ call }: { call: Call }) {
  const price = call.agreedRate ?? call.offers.at(-1);
  return (
    <li className={styles.row} data-status={call.status}>
      <span className="mono">{call.agent}</span>
      <strong>{call.contact.name}</strong>
      <span className={styles.price}>{price ? inr(price) : ""}</span>
      <StatusChip status={call.status} />
    </li>
  );
}
