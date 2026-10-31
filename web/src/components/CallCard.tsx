import { callStage } from "@/lib/loads.ts";
import { inr } from "@/lib/negotiate.ts";
import type { Call, CallStatus } from "@/lib/types.ts";
import styles from "./CallCard.module.css";

const LABEL: Record<CallStatus, string> = {
  queued: "Waiting",
  ringing: "Ringing",
  talking: "On the call",
  agreed: "Agreed",
  booked: "Booked",
  released: "Cheaper truck found",
  outbid: "Outbid",
  too_expensive: "Too expensive",
  not_free: "Truck not free",
  call_later: "Call later",
  no_answer: "No answer",
  failed: "Call failed",
};

export function StatusChip({ status }: { status: CallStatus }) {
  return (
    <span className={styles.chip} data-status={status}>
      {(status === "ringing" || status === "talking") && <span className={styles.pulse} aria-hidden />}
      {LABEL[status]}
    </span>
  );
}

// Owner asks and our offers, in the order they happened.
function Ladder({ call }: { call: Call }) {
  const steps: { who: "owner" | "agent"; amount: number }[] = [];
  const n = Math.max(call.quotes.length, call.offers.length);
  for (let i = 0; i < n; i++) {
    if (call.quotes[i] !== undefined) steps.push({ who: "owner", amount: call.quotes[i] });
    if (call.offers[i] !== undefined) steps.push({ who: "agent", amount: call.offers[i] });
  }
  if (!steps.length) return null;
  return (
    <ol className={styles.ladder} aria-label="Price negotiation">
      {steps.map((s, i) => (
        <li key={i} data-who={s.who}>
          <span className={styles.ladderWho}>{s.who === "owner" ? "Asked" : "Offered"}</span>
          {inr(s.amount)}
        </li>
      ))}
      {call.agreedRate !== undefined && (
        <li data-who="deal">
          <span className={styles.ladderWho}>Deal</span>
          {inr(call.agreedRate)}
        </li>
      )}
    </ol>
  );
}

export function CallCard({ call, lines = 3 }: { call: Call; lines?: number }) {
  const recent = call.transcript.slice(-lines);
  const stage = callStage(call);
  return (
    <article className={styles.card} data-status={call.status}>
      <header className={styles.head}>
        <div>
          <p className={`${styles.agent} mono`}>
            Agent {call.agent}
            <span data-live={call.live}>{call.live ? "Real call" : "Simulated"}</span>
          </p>
          <h3 className={styles.name}>{call.contact.name}</h3>
          <p className={styles.meta}>
            {call.contact.city}, {call.contact.truck}
          </p>
        </div>
        <StatusChip status={call.status} />
      </header>

      <Ladder call={call} />

      {stage && <p className={`${styles.stage} mono`}>{stage}</p>}

      {call.rival !== undefined && !["booked", "released"].includes(call.status) && (
        <p className={`${styles.rival} mono`}>Told the owner a truck is ready at {inr(call.rival)}</p>
      )}

      {recent.length > 0 && (
        <ul className={styles.transcript} aria-live="polite">
          {recent.map((t) => (
            <li key={`${t.at}-${t.who}-${t.text.length}`} data-who={t.who}>
              <span className={styles.speaker}>{t.who === "agent" ? "Bhaada" : call.contact.name.split(" ")[0]}</span>
              {t.text}
            </li>
          ))}
        </ul>
      )}

      {call.status === "booked" && call.vehicle && (
        <p className={styles.result}>
          {call.vehicle}, driver {call.driverPhone}
        </p>
      )}
    </article>
  );
}
