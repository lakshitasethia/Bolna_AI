import { createHash, timingSafeEqual } from "node:crypto";
import type { Load } from "./types.ts";

// Who may do what. The public site has no login, so anything that rings a
// phone or spends Bolna credits needs a secret, and every check fails closed:
// an unset secret refuses everyone instead of letting everyone in.

// Compares secrets in constant time, so response timing can't leak them.
export function sameSecret(given: string | null | undefined, expected: string | undefined): boolean {
  if (!expected || !given) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

// The desk passcode guards real calls and phone-in. Without one set on the
// server, both stay off.
export const PASSCODE_HEADER = "x-bhaada-passcode";
export const passcodeSet = () => Boolean(process.env.BHAADA_DESK_PASSCODE);
export const deskAuthorized = (req: Request) =>
  sameSecret(req.headers.get(PASSCODE_HEADER), process.env.BHAADA_DESK_PASSCODE);

// Bolna's custom functions send BHAADA_TOOL_TOKEN as a bearer token.
export function toolAuthorized(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  return sameSecret(auth.replace(/^Bearer\s+/i, ""), process.env.BHAADA_TOOL_TOKEN);
}

// Bolna's webhook can't send headers, so the setup script puts the same token
// in the webhook URL's query string.
export function webhookAuthorized(req: Request) {
  return sameSecret(new URL(req.url).searchParams.get("token"), process.env.BHAADA_TOOL_TOKEN) || toolAuthorized(req);
}

// Phone-in polling only looks up desk sessions. A real phone call is keyed by
// the caller's number, which anyone who knows it could otherwise use.
export const isDeskSession = (session: string | null | undefined): session is string =>
  Boolean(session && /^desk_[A-Za-z0-9_-]{16,}$/.test(session));

// What the browser gets. Phone numbers belong to real owners (a phone-in
// rings the server's own list, which the transporter never typed), the
// simulator's bargaining limits would give away the floor, and the Bolna
// execution id is what lets the webhook change a call.
export function publicLoad(load: Load): Load {
  const view: Load = {
    ...load,
    calls: load.calls.map((call) => {
      const c = { ...call, contact: { ...call.contact, phone: maskPhone(call.contact.phone) } };
      delete c.executionId;
      delete c.sim;
      delete c.contact.persona;
      return c;
    }),
  };
  delete view.transporterPhone;
  delete view.session;
  return view;
}

export const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? `••••${digits.slice(-4)}` : "";
};
