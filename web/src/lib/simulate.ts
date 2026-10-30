// Simulated truck owners, so the desk can be demoed without spending call
// minutes. The agent's side runs through the same `decide` rules as live calls.
import { declineStatus, recordLock, recordOutbid, termsFor } from "./board.ts";
import { decide, inr, sayFor } from "./negotiate.ts";
import { isDone, settle } from "./loads.ts";
import type { Call, Load } from "./types.ts";

const GAP = { ring: 1400, line: 2300, short: 1500 };

// Simulates every owner who isn't getting a real call.
export function startSim(load: Load, now = Date.now()) {
  load.calls.forEach((call, i) => {
    // The agents dial together; a little stagger keeps the lines from moving in lockstep.
    if (!call.live) call.sim = { phase: "dial", nextAt: now + 300 + i * 650 };
  });
}

// Play every simulated event that is due by `now`. Safe to call on every poll.
export function advance(load: Load, now = Date.now()) {
  let progressed = true;
  while (progressed) {
    progressed = false;
    // Play the earliest due event first, so agents hear each other's locks in order.
    const due = load.calls
      .filter((c) => c.sim && c.sim.phase !== "done" && !isDone(c) && c.sim.nextAt <= now)
      .sort((a, b) => a.sim!.nextAt - b.sim!.nextAt)[0];
    if (due) {
      step(load, due, due.sim!.nextAt);
      progressed = true;
    }
  }
  // Live calls settle from their webhooks, at real time.
  if (load.calls.every((c) => !c.live)) settle(load, latestEventAt(load) ?? now);
}

function latestEventAt(load: Load) {
  const ends = load.calls.map((c) => c.endedAt).filter((t): t is number => t !== undefined);
  return ends.length ? Math.max(...ends) : undefined;
}

function say(call: Call, who: "agent" | "owner", text: string, at: number) {
  call.transcript.push({ who, text, at });
}

function end(call: Call, status: Call["status"], at: number) {
  call.status = status;
  call.endedAt = at;
  call.sim!.phase = "done";
}

function step(load: Load, call: Call, at: number) {
  const sim = call.sim!;
  const p = call.contact.persona;
  const name = call.contact.name.split(" ")[0];
  const next = (phase: typeof sim.phase, gap: number) => {
    sim.phase = phase;
    sim.nextAt = at + gap;
  };

  switch (sim.phase) {
    case "dial":
      call.status = "ringing";
      call.startedAt = at;
      return next("greet", GAP.ring);

    case "greet":
      if (p?.noAnswer) return end(call, "no_answer", at);
      call.status = "talking";
      say(
        call,
        "agent",
        `Namaste ${name} ji, ${load.transporter} se bol rahi hoon. ${load.from} se ${load.to}, ${load.pickup}, ${load.truck}, ${load.weightTons} ton. Gaadi free hai?`,
        at,
      );
      return next("owner_answer", GAP.line);

    case "owner_answer":
      if (!p) {
        say(call, "owner", "Hello? Kaun?", at);
        return end(call, "call_later", at);
      }
      if (!p.available) {
        say(call, "owner", p.busyLine ?? "Nahi bhai, gaadi abhi bahar hai. Parso free hogi.", at);
        say(call, "agent", `Koi baat nahi ${name} ji, agli baar. Dhanyavaad!`, at + 900);
        return end(call, "not_free", at + 900);
      }
      say(call, "owner", `Haan, gaadi khaali hai. ${inr(p.open)} lagega.`, at);
      call.quotes.push(p.open);
      sim.pendingQuote = p.open;
      sim.pendingFinal = false;
      return next("agent_respond", GAP.line);

    case "agent_respond": {
      const quote = sim.pendingQuote!;
      const history = { offers: call.offers, quotes: call.quotes.slice(0, -1) };
      const terms = termsFor(load, call);
      const d = decide(terms, history, quote, sim.pendingFinal);
      say(call, "agent", sayFor(d, name, terms.rival), at);
      if (d.action === "counter") {
        call.offers.push(d.offer);
        call.rival = terms.rival;
        return next("owner_reply", GAP.line);
      }
      if (d.action === "accept") {
        call.agreedRate = d.rate;
        recordLock(load, call, at);
        return next("details", GAP.line);
      }
      const status = declineStatus(load, call, terms.rival);
      if (status === "outbid") recordOutbid(load, call, terms.rival!, at);
      return end(call, status, at);
    }

    case "owner_reply": {
      const offer = call.offers.at(-1)!;
      if (offer >= p!.floor) {
        say(call, "owner", `Chalo theek hai, ${inr(offer)} pe kar dete hain.`, at);
        call.agreedRate = offer;
        recordLock(load, call, at);
        say(call, "agent", "Note kar liya. Gaadi number aur driver ka number bata dijiye.", at + 1200);
        return next("details", GAP.line + 1200);
      }
      // Hearing that another truck is already lined up, owners drop straight to their floor.
      const quote = call.rival ? p!.floor : Math.max(p!.floor, call.quotes.at(-1)! - p!.concede);
      const final = quote === p!.floor;
      say(call, "owner", final ? `${inr(quote)}, isse kam nahi hoga. Final.` : `Nahi bhai, ${inr(quote)} se kam nahi.`, at);
      call.quotes.push(quote);
      sim.pendingQuote = quote;
      sim.pendingFinal = final;
      return next("agent_respond", GAP.line);
    }

    case "details":
      say(call, "owner", `Gaadi ${p!.vehicle}. Driver ${p!.driver}, number ${p!.driverPhone}.`, at);
      call.vehicle = p!.vehicle;
      call.driverPhone = p!.driverPhone;
      return next("readback", GAP.line);

    case "readback":
      say(call, "agent", `Confirm kar rahi hoon: ${spell(p!.vehicle)}, ${inr(call.agreedRate!)}, ${load.pickup}. Sahi hai?`, at);
      return next("confirm", GAP.line);

    case "confirm":
      say(call, "owner", "Haan, sahi hai.", at);
      say(call, "agent", "Dhanyavaad! Das minute mein final confirmation bhejti hoon.", at + 900);
      return end(call, "agreed", at + 900);
  }
}

// "RJ14GB4521" -> "R J 1 4, G B, 4 5 2 1", so digits are read one by one.
export function spell(vehicle: string) {
  return (vehicle.replace(/\s+/g, "").match(/[A-Z]+|\d+/gi) ?? [vehicle])
    .map((part) => part.split("").join(" "))
    .join(", ");
}

export const simDone = (load: Load) => load.calls.every(isDone);
