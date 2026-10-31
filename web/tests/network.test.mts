import assert from "node:assert/strict";
import { test } from "node:test";
import { toE164 } from "../src/lib/bolna.ts";
import { DEMO_CONTACTS } from "../src/lib/demo.ts";
import { hasPhone } from "../src/lib/loads.ts";
import { network } from "../src/lib/network.ts";
import type { Contact } from "../src/lib/types.ts";

const typed = (phone: string, name = ""): Contact => ({ id: phone, name, phone, city: "", truck: "" });
const dialled = (owners: Contact[]) => owners.filter(hasPhone).map((c) => toE164(c.phone));

test("every way of typing an Indian mobile dials the same number", () => {
  for (const phone of ["9000012345", "09000012345", "919000012345", "+919000012345", "+91 90000 12345", "+91 09000012345", "0091 9000012345", "+9000012345"]) {
    assert.equal(toE164(phone), "+919000012345", phone);
  }
});

test("calls every number from the env and the desk, past the six demo owners", () => {
  const numbers = ["9000000001", "9000000002", "9000000003", "9000000004"];
  process.env.BHAADA_OWNER_PHONES = `Asha:${numbers[0]},${numbers[1]},${numbers[2]},${numbers[3]}`;
  const owners = network(["9000000005", "9000000006", "9000000007", "9000000008"].map((p) => typed(p)));
  assert.equal(owners.length, 8);
  assert.equal(owners[0].name, "Asha");
  assert.equal(new Set(dialled(owners)).size, 8);
});

test("the same number is called once, however it was typed", () => {
  process.env.BHAADA_OWNER_PHONES = "+919000012345";
  assert.deepEqual(dialled(network([typed("09000012345")])), ["+919000012345"]);
});

test("with no numbers, every owner is simulated", () => {
  delete process.env.BHAADA_OWNER_PHONES;
  assert.deepEqual(network(), DEMO_CONTACTS);
});
