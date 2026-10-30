import type { BoardEvent } from "@/lib/types.ts";
import styles from "./Board.module.css";

const TAG: Record<BoardEvent["kind"], string> = {
  locked: "Locked",
  beat: "Beat it",
  backup: "Backup",
  broadcast: "To all",
  outbid: "Outbid",
  booked: "Booked",
  no_truck: "No truck",
};

// The channel the agents on one load use to tell each other what they've locked.
export function Board({ events, start, limit }: { events: BoardEvent[]; start: number; limit?: number }) {
  const shown = limit ? events.slice(-limit) : events;
  return (
    <section className={styles.board} aria-label="Agent channel">
      <p className={`${styles.head} mono`}>
        <span>Agent channel</span>
        <span>{events.length ? `${events.length} messages` : "Listening"}</span>
      </p>
      {shown.length === 0 ? (
        <p className={styles.idle}>When an owner agrees, the agent posts the rate here and the rest have to beat it.</p>
      ) : (
        <ol className={styles.list} aria-live="polite">
          {shown.map((e) => (
            <li key={`${e.at}-${e.agent}-${e.kind}`} data-kind={e.kind}>
              <span className={`${styles.time} mono`}>+{Math.max(0, Math.round((e.at - start) / 1000))}s</span>
              <span className={`${styles.agent} mono`}>{e.agent === "Desk" ? "Desk" : `Agent ${e.agent}`}</span>
              <span className={`${styles.tag} mono`}>{TAG[e.kind]}</span>
              <span className={styles.text}>{e.text}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
