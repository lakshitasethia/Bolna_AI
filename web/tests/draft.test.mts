import assert from "node:assert/strict";
import { test } from "node:test";
import { draftFrom } from "../src/lib/draft.ts";
import { draftForSession, saveDraft } from "../src/lib/store.ts";

test("keeps only what was really said", () => {
  assert.deepEqual(
    draftFrom({ pickup_place: " चेन्नई ", drop_place: "", pickup_time: "None", truck: "", weight_tons: "", max_rate: "", target_rate: "" }),
    { from: "चेन्नई" },
  );
});

test("reads weights and amounts into numbers", () => {
  assert.deepEqual(draftFrom({ weight_tons: "20", max_rate: "25 हज़ार", target_rate: "₹23,000" }), {
    weightTons: 20,
    target: 23000,
    ceiling: 25000,
  });
  assert.deepEqual(draftFrom({ weight_tons: "abc", max_rate: "0" }), {});
});

test("each detail adds to the draft, and a correction replaces the old value", () => {
  saveDraft("s1", draftFrom({ pickup_place: "Chennai" }));
  saveDraft("s1", draftFrom({ pickup_place: "", drop_place: "Jaipur" }));
  saveDraft("s1", draftFrom({ drop_place: "Pune", max_rate: "25000" }));
  assert.deepEqual(draftForSession("s1"), { from: "Chennai", to: "Pune", ceiling: 25000 });
  assert.deepEqual(draftForSession("other"), {});
});
