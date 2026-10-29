import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_CONTACTS, DEMO_LOAD } from "../src/lib/demo.ts";
import { createLoad } from "../src/lib/loads.ts";
import { advance, startSim } from "../src/lib/simulate.ts";

test("demo load books the cheapest truck that agreed", () => {
  const t0 = 1_000_000;
  const load = createLoad({ ...DEMO_LOAD, contacts: DEMO_CONTACTS, mode: "sim" }, t0);
  startSim(load, t0);
  advance(load, t0 + 5 * 60_000);

  assert.equal(load.status, "booked");
  assert.equal(load.booking?.ownerName, "Gurpreet Singh");
  assert.ok(load.booking!.rate <= DEMO_LOAD.ceiling);
  assert.equal(load.booking?.vehicle, "RJ14 GB 4521");

  const byName = Object.fromEntries(load.calls.map((c) => [c.contact.name, c.status]));
  assert.deepEqual(byName, { "Raju Yadav": "released", "Gurpreet Singh": "booked", "Anwar Khan": "not_free" });
});

test("no truck when every owner is too expensive", () => {
  const t0 = 2_000_000;
  const pricey = DEMO_CONTACTS.slice(0, 2).map((c) => ({ ...c, persona: { ...c.persona!, floor: 45000, open: 50000 } }));
  const load = createLoad({ ...DEMO_LOAD, contacts: pricey, mode: "sim" }, t0);
  startSim(load, t0);
  advance(load, t0 + 5 * 60_000);

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
