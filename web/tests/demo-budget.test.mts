import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_CONTACTS, DEMO_LOAD, fitToBudget } from "../src/lib/demo.ts";
import { callStage, createLoad } from "../src/lib/loads.ts";
import { advance, startSim } from "../src/lib/simulate.ts";
import type { Call } from "../src/lib/types.ts";

const run = (ceiling: number, target: number) => {
  const load = createLoad({ ...DEMO_LOAD, target, ceiling, contacts: DEMO_CONTACTS, mode: "sim" }, 0);
  startSim(load, 0);
  advance(load, 10 * 60_000);
  return load;
};

test("the demo load plays exactly as written", () => {
  assert.equal(fitToBudget(DEMO_CONTACTS[0], DEMO_LOAD.ceiling), DEMO_CONTACTS[0]);
  assert.equal(run(38000, 35000).booking?.rate, 35500);
});

test("demo owners still compete on a much smaller or larger budget", () => {
  for (const [ceiling, target] of [[25000, 23000], [120000, 110000]]) {
    const load = run(ceiling, target);
    assert.equal(load.status, "booked", String(ceiling));
    assert.ok(load.booking!.rate <= ceiling);
    assert.ok(load.board.some((e) => e.kind === "beat" || e.kind === "backup"), `no contest at ${ceiling}`);
  }
});

test("owners without a truck, and owners added by hand, aren't rescaled", () => {
  const busy = DEMO_CONTACTS.find((c) => !c.persona?.available)!;
  assert.equal(fitToBudget(busy, 25000), busy);
  const custom = { ...DEMO_CONTACTS[0], id: "c_mine" };
  assert.equal(fitToBudget(custom, 25000), custom);
});

test("a real call says how far it has got", () => {
  const call = (over: Partial<Call>) => ({ live: true, status: "talking", quotes: [], offers: [], ...over }) as Call;
  assert.equal(callStage(call({})), "Checking the truck is free");
  assert.equal(callStage(call({ quotes: [24000] })), "Bargaining on the rate");
  assert.match(callStage(call({ agreedRate: 22000 })) ?? "", /₹22,000, collecting/);
  assert.equal(callStage(call({ live: false })), undefined);
  assert.equal(callStage(call({ status: "ringing" })), undefined);
});
