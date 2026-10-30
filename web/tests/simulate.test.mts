import assert from "node:assert/strict";
import { test } from "node:test";
import { bestHold, termsFor } from "../src/lib/board.ts";
import { DEMO_CONTACTS, DEMO_LOAD } from "../src/lib/demo.ts";
import { createLoad } from "../src/lib/loads.ts";
import { advance, startSim } from "../src/lib/simulate.ts";

const run = (t0: number, contacts = DEMO_CONTACTS) => {
  const load = createLoad({ ...DEMO_LOAD, contacts, mode: "sim" }, t0);
  startSim(load, t0);
  advance(load, t0 + 5 * 60_000);
  return load;
};

test("six agents: each lock lowers the bar and the cheapest truck is booked", () => {
  const load = run(1_000_000);

  assert.equal(load.status, "booked");
  assert.equal(load.booking?.ownerName, "Mohan Lal");
  assert.equal(load.booking?.rate, 35500);
  assert.equal(load.booking?.savedVsFirst, 1500);
  assert.equal(load.booking?.vehicle, "UP14 FT 9032");

  const byName = Object.fromEntries(load.calls.map((c) => [c.contact.name, c.status]));
  assert.deepEqual(byName, {
    "Raju Yadav": "released",
    "Gurpreet Singh": "released",
    "Anwar Khan": "not_free",
    "Sukhwinder Gill": "outbid",
    "Vikram Chauhan": "no_answer",
    "Mohan Lal": "booked",
  });

  // Every new lock on the board is lower than the one before it.
  const locks = load.board.filter((e) => e.kind === "locked" || e.kind === "beat").map((e) => e.rate!);
  assert.deepEqual(locks, [37000, 36000, 35500]);
  assert.ok(load.board.some((e) => e.kind === "broadcast"));
});

test("an agent uses a locked rate as leverage, and only a real one", () => {
  const load = run(4_000_000);
  const mohan = load.calls.find((c) => c.contact.name === "Mohan Lal")!;
  assert.ok(mohan.transcript.some((t) => t.who === "agent" && t.text.includes("ek gaadi ₹36,000 mein mil rahi hai")));

  // No agent mentions another truck before anyone has agreed.
  const firstLock = load.board.find((e) => e.kind === "locked")!.at;
  for (const call of load.calls) {
    for (const t of call.transcript) {
      if (t.at < firstLock) assert.ok(!t.text.includes("ek gaadi"), `${call.agent} bluffed: ${t.text}`);
    }
  }
});

test("a locked rate caps every other agent, but not the one holding it", () => {
  const load = createLoad({ ...DEMO_LOAD, contacts: DEMO_CONTACTS, mode: "sim" }, 0);
  const [a, b] = load.calls;
  a.status = "talking";
  a.agreedRate = 36500;
  assert.equal(bestHold(load)?.rate, 36500);
  assert.deepEqual(termsFor(load, b), { target: 35000, ceiling: 36000, rival: 36500 });
  assert.deepEqual(termsFor(load, a), { target: 35000, ceiling: 38000 });

  // A hold that fell through stops counting.
  a.status = "call_later";
  assert.equal(bestHold(load), undefined);
});

test("no truck when every owner is too expensive", () => {
  const pricey = DEMO_CONTACTS.slice(0, 2).map((c) => ({ ...c, persona: { ...c.persona!, floor: 45000, open: 50000 } }));
  const load = run(2_000_000, pricey);

  assert.equal(load.status, "no_truck");
  assert.ok(load.calls.every((c) => c.status === "too_expensive"));
});

test("partial playback shows calls in progress", () => {
  const t0 = 3_000_000;
  const load = createLoad({ ...DEMO_LOAD, contacts: DEMO_CONTACTS, mode: "sim" }, t0);
  startSim(load, t0);
  advance(load, t0 + 4000);
  assert.equal(load.status, "calling");
  assert.ok(load.calls.some((c) => c.status === "talking"));
});

test("live loads only simulate owners without a phone number", () => {
  const contacts = DEMO_CONTACTS.map((c, i) => (i === 0 ? { ...c, phone: "98290 41234" } : c));
  const load = createLoad({ ...DEMO_LOAD, contacts, mode: "live" }, 0);
  startSim(load, 0);
  assert.equal(load.calls[0].live, true);
  assert.equal(load.calls[0].sim, undefined);
  assert.ok(load.calls.slice(1).every((c) => !c.live && c.sim));
  assert.deepEqual(load.calls.map((c) => c.agent), ["A", "B", "C", "D", "E", "F"]);
});
