import assert from "node:assert/strict";
import test from "node:test";
import { quoteGuard } from "../src/lib/board.ts";
import type { Call } from "../src/lib/types.ts";

const call = (over: Partial<Call>): Call =>
  ({ id: "c", agent: "A", live: true, contact: { id: "x", name: "Raju Yadav", phone: "", city: "", truck: "" }, status: "talking", quotes: [], offers: [], transcript: [], ...over }) as Call;

test("a finished call can't be reopened by a late quote", () => {
  for (const status of ["agreed", "too_expensive", "outbid", "call_later"] as const) {
    assert.deepEqual(quoteGuard(call({ status, agreedRate: 30000 }), 35000), { ok: true, say: "Dhanyavaad!" });
  }
});

test("an agreed rate can't be pushed up by a later quote", () => {
  assert.deepEqual(quoteGuard(call({ agreedRate: 30000 }), 35000), {
    action: "continue",
    rate: 30000,
    say: "Rate ₹30,000 hi rahega. Jo number baaki hai, woh bataiye.",
  });
});

test("digits heard after a rate is agreed don't restart the call", () => {
  assert.equal(quoteGuard(call({ agreedRate: 30000 }), NaN)?.action, "continue");
  assert.equal(quoteGuard(call({}), NaN), undefined);
});

test("an owner can still come down from an agreed rate, and normal quotes pass through", () => {
  assert.equal(quoteGuard(call({ agreedRate: 30000 }), 29000), undefined);
  assert.equal(quoteGuard(call({}), 35000), undefined);
});
