// The agents working one load share a board. When an owner agrees to a rate,
// every other agent on the load can only take a rate below it, and may tell
// its owner that a truck is already available at that price.
import { inr, sayFor, STEP, type Terms } from "./negotiate.ts";
import { isDone } from "./loads.ts";
import type { Call, CallStatus, Load } from "./types.ts";

// An agreed rate still counts while the call is wrapping up or the owner is waiting.
const HOLDING: CallStatus[] = ["talking", "agreed", "booked", "released"];

export const holds = (call: Call) => call.agreedRate !== undefined && HOLDING.includes(call.status);

// The cheapest truck that has agreed, optionally ignoring one call.
export function bestHold(load: Load, except?: Call): { call: Call; rate: number } | undefined {
  let best: { call: Call; rate: number } | undefined;
  for (const call of load.calls) {
    if (call === except || !holds(call)) continue;
    if (!best || call.agreedRate! < best.rate) best = { call, rate: call.agreedRate! };
  }
  return best;
}

export interface BoardTerms extends Terms {
  rival?: number; // the rate this agent has to beat
}

// The budget one agent works to: the transporter's, lowered under any truck
// another agent has already locked.
export function termsFor(load: Load, call: Call): BoardTerms {
  const best = bestHold(load, call);
  if (!best) return { target: load.target, ceiling: load.ceiling };
  const ceiling = Math.min(load.ceiling, best.rate - STEP);
  return { target: Math.min(load.target, ceiling), ceiling, rival: best.rate };
}

// The reply to a quote that mustn't change anything: a finished call stays
// finished, and an owner who has agreed a rate can't push it up afterwards.
export function quoteGuard(call: Call, quote: number) {
  if (isDone(call)) return { ok: true, say: "Dhanyavaad!" };
  if (call.agreedRate !== undefined && quote >= call.agreedRate) {
    const decision = { action: "accept" as const, rate: call.agreedRate };
    return { ...decision, say: sayFor(decision, first(call)) };
  }
}

const others = (load: Load, call: Call) => load.calls.filter((c) => c !== call && !isDone(c)).map((c) => c.agent);

const first = (call: Call) => call.contact.name.split(" ")[0];

// Call when an owner agrees to a rate. Posts it to the board and, if it's the
// new best, tells the agents still on their calls to beat it.
export function recordLock(load: Load, call: Call, at: number) {
  const rate = call.agreedRate!;
  const prev = bestHold(load, call);
  if (prev && prev.rate <= rate) {
    load.board.push({ at, agent: call.agent, kind: "backup", rate, text: `${first(call)} agreed ${inr(rate)}, kept as backup` });
    return;
  }
  load.board.push(
    prev
      ? { at, agent: call.agent, kind: "beat", rate, text: `${first(call)} beat ${inr(prev.rate)} with ${inr(rate)}` }
      : { at, agent: call.agent, kind: "locked", rate, text: `${first(call)} agreed ${inr(rate)}` },
  );
  const listening = others(load, call);
  if (listening.length) {
    load.board.push({
      at,
      agent: call.agent,
      kind: "broadcast",
      rate,
      text: `Agents ${listening.join(", ")}: only book under ${inr(rate)}`,
    });
  }
}

export function recordOutbid(load: Load, call: Call, rival: number, at: number) {
  load.board.push({ at, agent: call.agent, kind: "outbid", rate: rival, text: `${first(call)} wouldn't go under ${inr(rival)}` });
}

// A decline is "outbid" when the owner's price fit the transporter's budget
// but not the bar another agent set.
export const declineStatus = (load: Load, call: Call, rival?: number): CallStatus =>
  rival !== undefined && (call.quotes.at(-1) ?? Infinity) <= load.ceiling ? "outbid" : "too_expensive";
