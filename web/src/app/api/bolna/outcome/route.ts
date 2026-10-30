// Bolna custom function `report_outcome`: the agent calls this once, at the
// end of the conversation, with how the call ended.
import { recordLock } from "@/lib/board.ts";
import { parseRupees, readParams, toolAuthorized } from "@/lib/bolna.ts";
import { settleAndNotify } from "@/lib/finish.ts";
import { findCall } from "@/lib/store.ts";
import { checkDetails } from "@/lib/vehicle.ts";
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
  // A call that already has its outcome can't be changed by a second report.
  if (call.endedAt !== undefined) return Response.json({ ok: true, say: "Dhanyavaad!" });
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
    const details = checkDetails((call.detailRetries ??= {}), p.vehicle_number, p.driver_phone);
    if (details.retry) return Response.json({ ok: false, retry: details.retry, say: details.say });
    const fresh = call.agreedRate !== rate;
    call.agreedRate = rate;
    call.vehicle = details.vehicle;
    call.driverPhone = details.driverPhone;
    call.detailsToCheck = details.toCheck;
    // The owner took one of our offers without the agent submitting it first.
    if (fresh) recordLock(load, call, Date.now());
  }

  // Keep "outbid" when the agent reports a decline that the board caused.
  call.status = status === "too_expensive" && call.status === "outbid" ? "outbid" : status;
  call.endedAt = Date.now();
  await settleAndNotify(load);

  return Response.json({ ok: true, say: status === "agreed" ? "Dhanyavaad! Das minute mein final confirmation bhejti hoon." : "Dhanyavaad!" });
}

export const GET = POST;
