import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDetails, normalizeMobile, normalizeVehicle } from "../src/lib/vehicle.ts";

test("accepts SS RR LL NNNN vehicle numbers in any spacing", () => {
  assert.equal(normalizeVehicle("mh-12 ab 1234"), "MH 12 AB 1234");
  assert.equal(normalizeVehicle("RJ14GB4521"), "RJ 14 GB 4521");
  assert.equal(normalizeVehicle("HR69 C 2210"), "HR 69 C 2210");
  assert.equal(normalizeVehicle("DL1LAB4000"), "DL 1 LAB 4000");
});

test("rejects vehicle numbers that don't fit the format", () => {
  for (const bad of ["MH-FAT-48-D-L", "MH12AB123", "12AB1234", "MH12ABCD1234", "", undefined]) {
    assert.equal(normalizeVehicle(bad), null, String(bad));
  }
});

test("accepts ten digit Indian mobiles, with or without a prefix", () => {
  assert.equal(normalizeMobile("98290 41234"), "9829041234");
  assert.equal(normalizeMobile("+91 98290-41234"), "9829041234");
  assert.equal(normalizeMobile("09829041234"), "9829041234");
});

test("rejects short, long or landline-style numbers", () => {
  for (const bad of ["4321", "98290412345", "1829041234", "", undefined]) {
    assert.equal(normalizeMobile(bad), null, String(bad));
  }
});

// Every simulated owner must give details that pass the same checks.
import { DEMO_CONTACTS } from "../src/lib/demo.ts";
test("simulated owners give valid vehicle and driver numbers", () => {
  for (const c of DEMO_CONTACTS.filter((c) => c.persona?.available)) {
    assert.ok(normalizeVehicle(c.persona!.vehicle), c.persona!.vehicle);
    assert.ok(normalizeMobile(c.persona!.driverPhone), c.persona!.driverPhone);
  }
});

test("asks again twice per detail, then books and flags it for the desk", () => {
  const retries = {};
  assert.equal(checkDetails(retries, "MH-FAT-48-D-L", "4321").retry, "vehicle_number");
  assert.equal(checkDetails(retries, "MH-FAT", "4321").retry, "vehicle_number");
  assert.equal(checkDetails(retries, "MH-FAT", "4321").retry, "driver_phone");
  assert.equal(checkDetails(retries, "MH-FAT", "4321").retry, "driver_phone");
  assert.deepEqual(checkDetails(retries, "mh-fat", " 4321 "), { vehicle: "MH-FAT", driverPhone: "4321", toCheck: true });
});

test("good details go straight through, unflagged", () => {
  assert.deepEqual(checkDetails({}, "mh 48 dl 4321", "+91 98290 41234"), {
    vehicle: "MH 48 DL 4321",
    driverPhone: "9829041234",
    toCheck: false,
  });
});
