import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRupees } from "../src/lib/bolna.ts";
import { closeUnreported, createLoad, noTruckReason, settle } from "../src/lib/loads.ts";
import type { Contact } from "../src/lib/types.ts";

const owner = (name: string): Contact => ({ id: name, name, phone: "9000012345", city: "", truck: "" });
const load = (...names: string[]) =>
  createLoad({
    transporter: "T",
    from: "Chennai",
    to: "Jaipur",
    pickup: "kal",
    truck: "32 ft",
    weightTons: 20,
    target: 23000,
    ceiling: 25000,
    mode: "live",
    contacts: names.map(owner),
  });

test("a rate agreed before the line dropped still books the truck, flagged for a person", () => {
  const l = load("Raju");
  l.calls[0].agreedRate = 22000;
  closeUnreported(l.calls[0], 1);
  assert.equal(settle(l, 1), true);
  assert.equal(l.status, "booked");
  assert.equal(l.booking?.rate, 22000);
  assert.equal(l.booking?.detailsToCheck, true);
});

test("details already collected aren't flagged when the line drops", () => {
  const [call] = load("Raju").calls;
  Object.assign(call, { agreedRate: 22000, vehicle: "MH 01 AA 1234", driverPhone: "9000012345" });
  closeUnreported(call, 1);
  assert.equal(call.detailsToCheck, undefined);
});

test("a dropped call with no rate blames the call, not the budget", () => {
  const l = load("Raju");
  closeUnreported(l.calls[0], 1);
  settle(l, 1);
  assert.equal(l.status, "no_truck");
  assert.equal(l.board.at(-1)?.text, "No owner confirmed a truck");
});

test("budget is the reason only when a price was refused", () => {
  const l = load("Raju", "Mohan");
  closeUnreported(l.calls[0], 1);
  Object.assign(l.calls[1], { status: "too_expensive", endedAt: 1 });
  settle(l, 1);
  assert.equal(noTruckReason(l), "No truck within budget");
});

test("reads amounts written in Hindi or with a currency word", () => {
  for (const raw of ["22 हज़ार", "22 हजार", "22 हज़ार", "22000 रुपये", "₹22,000।", "22,000/-", "Rs. 22000", "22000 rupaye"]) {
    assert.equal(parseRupees(raw), 22000, raw);
  }
  assert.equal(parseRupees("2 लाख"), 200000);
});
