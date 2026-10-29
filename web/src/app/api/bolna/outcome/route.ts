// Bolna custom function `report_outcome`: the agent calls this once, at the
// end of the conversation, with how the call ended.
import { parseRupees, readParams, toolAuthorized } from "@/lib/bolna.ts";
import { settleAndNotify } from "@/lib/finish.ts";
import { findCall } from "@/lib/store.ts";
import type { CallStatus } from "@/lib/types.ts";

const OUTCOMES: Record<string, CallStatus> = {
  AGREED: "agreed",
  NOT_FREE: "not_free",
  TOO_EXPENSIVE: "too_expensive",
  CALL_LATER: "call_later",
  WRONG_PERSON: "call_later",
};

export async function POST(req: Request) {
  if (!toolAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const p = await readParams(req);
  const found = findCall(p.load_id, p.call_id);
  if (!found) return Response.json({ error: "Unknown load or call." }, { status: 404 });

  const { load, call } = found;
  const status = OUTCOMES[(p.outcome ?? "").toUpperCase()];
  if (!status) return Response.json({ error: `outcome must be one of ${Object.keys(OUTCOMES).join(", ")}` }, { status: 400 });

  if (status === "agreed") {
    // Only a rate our rules produced can be booked: one we accepted, or one we offered.
    const rate = parseRupees(p.final_rate);
    const approved = rate === call.agreedRate || call.offers.includes(rate);
    if (!approved || rate > load.ceiling) {
      return Response.json({
        ok: false,
        say: "Ek minute, rate confirm karna padega. Main office se baat karke callback karti hoon.",
      });
    }
    call.agreedRate = rate;
    call.vehicle = (p.vehicle_number ?? "").toUpperCase();
    call.driverPhone = p.driver_phone ?? "";
  }

  call.status = status;
  call.endedAt = Date.now();
  await settleAndNotify(load);

  return Response.json({ ok: true, say: status === "agreed" ? "Dhanyavaad! Confirmation SMS aa jayega." : "Dhanyavaad!" });
}

export const GET = POST;
