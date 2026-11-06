import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  deskAuthorized,
  isDeskSession,
  publicLoad,
  sameSecret,
  toolAuthorized,
  webhookAuthorized,
} from "../src/lib/access.ts";
import { createLoad } from "../src/lib/loads.ts";
import { getLoad, MAX_LOADS, saveLoad } from "../src/lib/store.ts";
import type { Contact } from "../src/lib/types.ts";

const saved = { ...process.env };
afterEach(() => {
  process.env.BHAADA_TOOL_TOKEN = saved.BHAADA_TOOL_TOKEN;
  process.env.BHAADA_DESK_PASSCODE = saved.BHAADA_DESK_PASSCODE;
  if (saved.BHAADA_TOOL_TOKEN === undefined) delete process.env.BHAADA_TOOL_TOKEN;
  if (saved.BHAADA_DESK_PASSCODE === undefined) delete process.env.BHAADA_DESK_PASSCODE;
});

const req = (headers: Record<string, string> = {}, url = "https://x.test/api/bolna/webhook") =>
  new Request(url, { method: "POST", headers });

const owner = (phone: string): Contact => ({
  id: `c_${phone.length}`,
  name: "Raju Yadav",
  phone,
  city: "Okhla",
  truck: "32 ft",
  persona: { available: true, open: 38000, floor: 36000, concede: 1000, vehicle: "", driver: "", driverPhone: "" },
});

const load = () =>
  createLoad({
    transporter: "T",
    from: "Okhla",
    to: "Jaipur",
    pickup: "kal",
    truck: "32 ft",
    weightTons: 20,
    target: 35000,
    ceiling: 38000,
    mode: "live",
    session: "desk_0123456789abcdef0123",
    transporterPhone: "9812345678",
    contacts: [owner("98110 22314"), owner("")],
  });

test("secrets only match exactly, and an unset secret matches nothing", () => {
  assert.equal(sameSecret("abc", "abc"), true);
  assert.equal(sameSecret("abd", "abc"), false);
  assert.equal(sameSecret("", ""), false);
  assert.equal(sameSecret("anything", undefined), false);
  assert.equal(sameSecret(null, "abc"), false);
});

test("tool calls are refused when no token is set on the server", () => {
  delete process.env.BHAADA_TOOL_TOKEN;
  assert.equal(toolAuthorized(req()), false);
  assert.equal(toolAuthorized(req({ authorization: "Bearer " })), false);
});

test("tool calls need the right bearer token", () => {
  process.env.BHAADA_TOOL_TOKEN = "tok-123";
  assert.equal(toolAuthorized(req({ authorization: "Bearer tok-123" })), true);
  assert.equal(toolAuthorized(req({ authorization: "Bearer tok-124" })), false);
  assert.equal(toolAuthorized(req()), false);
});

test("webhooks need the token in the URL, and fail closed", () => {
  delete process.env.BHAADA_TOOL_TOKEN;
  assert.equal(webhookAuthorized(req({}, "https://x.test/api/bolna/webhook?token=")), false);
  process.env.BHAADA_TOOL_TOKEN = "tok 1/2";
  assert.equal(webhookAuthorized(req({}, `https://x.test/api/bolna/webhook?token=${encodeURIComponent("tok 1/2")}`)), true);
  assert.equal(webhookAuthorized(req({}, "https://x.test/api/bolna/webhook?token=nope")), false);
  assert.equal(webhookAuthorized(req()), false);
});

test("the desk passcode gates real calls, and no passcode means no real calls", () => {
  delete process.env.BHAADA_DESK_PASSCODE;
  assert.equal(deskAuthorized(req({ "x-bhaada-passcode": "" })), false);
  process.env.BHAADA_DESK_PASSCODE = "chai";
  assert.equal(deskAuthorized(req({ "x-bhaada-passcode": "chai" })), true);
  assert.equal(deskAuthorized(req({ "x-bhaada-passcode": "Chai" })), false);
  assert.equal(deskAuthorized(req()), false);
});

test("the browser never gets owners' numbers, Bolna ids or simulator limits", () => {
  const l = load();
  l.calls[0].executionId = "exec-secret";
  const view = publicLoad(l);
  const json = JSON.stringify(view);
  assert.equal(view.calls[0].contact.phone, "••••2314");
  assert.equal(view.calls[1].contact.phone, "");
  assert.ok(!json.includes("98110"));
  assert.ok(!json.includes("9812345678"));
  assert.ok(!json.includes("exec-secret"));
  assert.ok(!json.includes("floor"));
  assert.ok(!json.includes("desk_0123456789abcdef0123"));
  // The server's own copy keeps everything the calls need.
  assert.equal(l.calls[0].contact.phone, "98110 22314");
  assert.equal(l.calls[0].executionId, "exec-secret");
  assert.ok(l.calls[0].contact.persona);
  // What the desk shows is still there.
  assert.equal(view.ceiling, 38000);
  assert.equal(view.calls[0].contact.name, "Raju Yadav");
});

test("load and call ids can't be guessed from each other", () => {
  const a = load();
  const b = load();
  assert.match(a.id, /^load_[0-9a-f]{24}$/);
  assert.match(a.calls[0].id, /^call_[0-9a-f]{24}$/);
  assert.notEqual(a.id, b.id);
});

test("phone-in lookups only accept long desk sessions, not a caller's number", () => {
  assert.equal(isDeskSession("desk_0123456789abcdef0123"), true);
  assert.equal(isDeskSession("desk_abc123"), false);
  assert.equal(isDeskSession("+919812345678"), false);
  assert.equal(isDeskSession(null), false);
});

test("the store keeps a load still on the phones when it trims old ones", () => {
  const active = load();
  saveLoad(active);
  for (let i = 0; i < MAX_LOADS + 5; i++) {
    const done = load();
    done.status = "booked";
    saveLoad(done);
  }
  assert.ok(getLoad(active.id), "the load still calling was dropped");
});
