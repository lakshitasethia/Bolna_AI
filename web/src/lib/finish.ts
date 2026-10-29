import { settle } from "./loads.ts";
import { notifyBooked } from "./notify.ts";
import type { Load } from "./types.ts";

const notified = new Set<string>();

// Settles the load if every call has ended, and sends the booking once.
export async function settleAndNotify(load: Load) {
  settle(load);
  if (load.status === "booked" && !notified.has(load.id)) {
    notified.add(load.id);
    await notifyBooked(load);
  }
}
