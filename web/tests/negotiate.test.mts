import assert from "node:assert/strict";
import { test } from "node:test";
import { decide } from "../src/lib/negotiate.ts";
import { parseRupees, toE164 } from "../src/lib/bolna.ts";
import { spell } from "../src/lib/simulate.ts";

const terms = { target: 35000, ceiling: 38000 };

test("accepts a quote at or under target straight away", () => {
  assert.deepEqual(decide(terms, { offers: [], quotes: [] }, 34000), { action: "accept", rate: 34000 });
});

test("opens at target, then meets halfway in ₹500 steps", () => {
  assert.deepEqual(decide(terms, { offers: [], quotes: [] }, 42000), { action: "counter", offer: 35000 });
  assert.deepEqual(decide(terms, { offers: [35000], quotes: [42000] }, 40000), { action: "counter", offer: 37500 });
});

test("never offers above the ceiling", () => {
  const d = decide(terms, { offers: [35000, 37500], quotes: [45000, 44000] }, 44000);
  assert.ok(d.action !== "counter" || d.offer <= terms.ceiling);
});

test("declines a final quote above the ceiling", () => {
  assert.equal(decide(terms, { offers: [35000], quotes: [42000] }, 39000, true).action, "decline");
});

test("takes a final quote under the ceiling", () => {
  assert.deepEqual(decide(terms, { offers: [35000], quotes: [39000] }, 37500, true), { action: "accept", rate: 37500 });
});

test("closes when the gap is one step", () => {
  assert.deepEqual(decide(terms, { offers: [35000, 36500], quotes: [39000] }, 37000), { action: "accept", rate: 37000 });
});

test("rejects a target above the ceiling", () => {
  assert.throws(() => decide({ target: 40000, ceiling: 38000 }, { offers: [], quotes: [] }, 41000));
});

// Property check: across many random owners, the agent never agrees above the
// ceiling, and its offers only ever go up.
test("random owners: never above ceiling, offers only rise", () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 5000; i++) {
    const target = 20000 + Math.round(rand() * 40) * 500;
    const ceiling = target + Math.round(rand() * 12) * 500;
    const floor = target - 4000 + Math.round(rand() * 30) * 500;
    let quote = floor + Math.round(rand() * 20) * 500;
    const offers: number[] = [];
    const quotes: number[] = [];
    let final = false;
    for (let round = 0; round < 10; round++) {
      const d = decide({ target, ceiling }, { offers, quotes }, quote, final);
      quotes.push(quote);
      if (d.action === "accept") {
        assert.ok(d.rate <= ceiling, `accepted ${d.rate} over ceiling ${ceiling}`);
        break;
      }
      if (d.action === "decline") break;
      assert.ok(d.offer <= ceiling);
      if (offers.length) assert.ok(d.offer > offers.at(-1)!, "offers must rise");
      offers.push(d.offer);
      if (d.offer >= floor) break; // owner takes our offer, which is under the ceiling
      quote = Math.max(floor, quote - 1000);
      final = quote === floor;
    }
  }
});

test("parses spoken rupee amounts", () => {
  assert.equal(parseRupees("₹38,500"), 38500);
  assert.equal(parseRupees("38.5k"), 38500);
  assert.equal(parseRupees("38 hazaar"), 38000);
  assert.ok(Number.isNaN(parseRupees("pata nahi")));
});

test("formats Indian numbers for dialling", () => {
  assert.equal(toE164("98290 41234"), "+919829041234");
  assert.equal(toE164("+91 98290 41234"), "+919829041234");
});

test("spells vehicle numbers for read-back", () => {
  assert.equal(spell("RJ14 GB 4521"), "R J, 1 4, G B, 4 5 2 1");
});
