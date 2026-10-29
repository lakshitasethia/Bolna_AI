import type { Booking, Call, Contact, Load, LoadInput } from "./types.ts";
import { TERMINAL } from "./types.ts";

let counter = 0;
const id = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

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
    status: "calling",
    calls: input.contacts.map((contact) => newCall(contact)),
  };
}

function newCall(contact: Contact): Call {
  return { id: id("call"), contact, status: "queued", quotes: [], offers: [], transcript: [] };
}

export const isDone = (call: Call) => TERMINAL.includes(call.status);

// Once every call has ended, book the cheapest truck that agreed and
// release the rest. Returns true the moment a load gets settled.
export function settle(load: Load, now = Date.now()): boolean {
  if (load.status !== "calling" || !load.calls.every(isDone)) return false;

  const agreed = load.calls
    .filter((c) => c.status === "agreed" && c.agreedRate !== undefined)
    .sort((a, b) => a.agreedRate! - b.agreedRate!);

  if (agreed.length === 0) {
    load.status = "no_truck";
    return true;
  }

  const [winner, ...rest] = agreed;
  winner.status = "booked";
  rest.forEach((c) => (c.status = "released"));

  const booking: Booking = {
    callId: winner.id,
    ownerName: winner.contact.name,
    rate: winner.agreedRate!,
    vehicle: winner.vehicle ?? "",
    driverPhone: winner.driverPhone ?? "",
    savedVsCeiling: load.ceiling - winner.agreedRate!,
    seconds: Math.round((now - load.createdAt) / 1000),
  };
  load.booking = booking;
  load.status = "booked";
  return true;
}
