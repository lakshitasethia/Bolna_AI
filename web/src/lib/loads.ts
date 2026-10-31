import { fitToBudget } from "./demo.ts";
import { inr } from "./negotiate.ts";
import type { Booking, Call, Contact, Load, LoadInput } from "./types.ts";
import { TERMINAL } from "./types.ts";

let counter = 0;
const id = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

export const hasPhone = (c: Contact) => c.phone.replace(/\D/g, "").length >= 10;

export function createLoad(input: LoadInput, now = Date.now()): Load {
  return {
    id: id("load"),
    createdAt: now,
    transporter: input.transporter,
    from: input.from,
    to: input.to,
    pickup: input.pickup,
    truck: input.truck,
    weightTons: input.weightTons,
    target: input.target,
    ceiling: input.ceiling,
    mode: input.mode,
    source: input.source ?? "desk",
    session: input.session,
    transporterPhone: input.transporterPhone,
    intake: input.intake,
    status: "calling",
    // On a live load, owners with a phone number get a real call; the rest are simulated.
    calls: input.contacts.map((contact, i) =>
      newCall(fitToBudget(contact, input.ceiling), i, input.mode === "live" && hasPhone(contact)),
    ),
    board: [],
  };
}

function newCall(contact: Contact, i: number, live: boolean): Call {
  return {
    id: id("call"),
    agent: String.fromCharCode(65 + i),
    live,
    contact,
    status: "queued",
    quotes: [],
    offers: [],
    transcript: [],
  };
}

export const isDone = (call: Call) => TERMINAL.includes(call.status);

// A call that ended with no reported outcome. An agreed rate still stands, so
// the truck can be booked, and a person confirms the numbers we never got.
export function closeUnreported(call: Call, now: number) {
  call.status = call.agreedRate === undefined ? "call_later" : "agreed";
  if (call.agreedRate !== undefined && !(call.vehicle && call.driverPhone)) call.detailsToCheck = true;
  call.endedAt = now;
}

// Bolna only sends a transcript when a call ends, so a real call shows how far
// it has got from what the tools have recorded.
export function callStage(call: Call): string | undefined {
  if (!call.live || call.status !== "talking") return undefined;
  if (call.agreedRate !== undefined) return `Rate agreed at ${inr(call.agreedRate)}, collecting truck and driver numbers`;
  if (call.offers.length || call.quotes.length) return "Bargaining on the rate";
  return "Checking the truck is free";
}

// Budget is only the reason when an owner's price was actually refused.
export const noTruckReason = (load: Load) =>
  load.calls.some((c) => c.status === "too_expensive" || c.status === "outbid")
    ? "No truck within budget"
    : "No owner confirmed a truck";

// Once every call has ended, book the cheapest truck that agreed and
// release the rest. Returns true the moment a load gets settled.
export function settle(load: Load, now = Date.now()): boolean {
  if (load.status !== "calling" || !load.calls.every(isDone)) return false;

  const agreed = load.calls
    .filter((c) => c.status === "agreed" && c.agreedRate !== undefined)
    .sort((a, b) => a.agreedRate! - b.agreedRate!);

  if (agreed.length === 0) {
    load.status = "no_truck";
    load.board.push({ at: now, agent: "Desk", kind: "no_truck", text: noTruckReason(load) });
    return true;
  }

  const [winner, ...rest] = agreed;
  winner.status = "booked";
  rest.forEach((c) => (c.status = "released"));

  // The first truck to agree is what one phone, working alone, would have booked.
  const firstLock = load.board.find((e) => e.kind === "locked")?.rate ?? winner.agreedRate!;
  const booking: Booking = {
    callId: winner.id,
    ownerName: winner.contact.name,
    rate: winner.agreedRate!,
    vehicle: winner.vehicle ?? "",
    driverPhone: winner.driverPhone ?? "",
    detailsToCheck: winner.detailsToCheck ?? false,
    savedVsCeiling: load.ceiling - winner.agreedRate!,
    savedVsFirst: Math.max(0, firstLock - winner.agreedRate!),
    seconds: Math.round((now - load.createdAt) / 1000),
  };
  load.booking = booking;
  load.status = "booked";
  load.board.push({
    at: now,
    agent: "Desk",
    kind: "booked",
    rate: booking.rate,
    text: `Booked ${winner.contact.name.split(" ")[0]} at ${inr(booking.rate)}${rest.length ? `, released ${rest.length} backup` : ""}`,
  });
  return true;
}
