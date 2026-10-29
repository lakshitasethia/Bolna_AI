// Simulated truck owners, so the desk can be demoed without spending call
// minutes. The agent's side runs through the same `decide` rules as live calls.
import { decide, inr, sayFor } from "./negotiate.ts";
import { isDone, settle } from "./loads.ts";
import type { Call, Load } from "./types.ts";

const GAP = { ring: 1400, line: 2300, short: 1500 };

export function startSim(load: Load, now = Date.now()) {
  load.calls.forEach((call, i) => {
    // Stagger the dials a little, like a person working two phones.
    call.sim = { phase: "dial", nextAt: now + 300 + i * 650 };
  });
}

// Play every simulated event that is due by `now`. Safe to call on every poll.
export function advance(load: Load, now = Date.now()) {
  if (load.mode !== "sim") return;
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const call of load.calls) {
      if (call.sim && call.sim.phase !== "done" && !isDone(call) && call.sim.nextAt <= now) {
        step(load, call, call.sim.nextAt);
        progressed = true;
      }
    }
  }
  settle(load, latestEventAt(load) ?? now);
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
      const d = decide(load, history, quote, sim.pendingFinal);
      say(call, "agent", sayFor(d, name), at);
      if (d.action === "counter") {
        call.offers.push(d.offer);
        return next("owner_reply", GAP.line);
      }
      if (d.action === "accept") {
        call.agreedRate = d.rate;
        return next("details", GAP.line);
      }
      return end(call, "too_expensive", at);
    }

    case "owner_reply": {
      const offer = call.offers.at(-1)!;
      if (offer >= p!.floor) {
        say(call, "owner", `Chalo theek hai, ${inr(offer)} pe kar dete hain.`, at);
        call.agreedRate = offer;
        say(call, "agent", "Pakka. Gaadi number aur driver ka number bata dijiye.", at + 1200);
        return next("details", GAP.line + 1200);
      }
      const quote = Math.max(p!.floor, call.quotes.at(-1)! - p!.concede);
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
      say(call, "agent", "Dhanyavaad! Confirmation SMS aa jayega.", at + 900);
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
