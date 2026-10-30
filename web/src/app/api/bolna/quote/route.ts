// Bolna custom function `submit_quote`: the agent calls this every time the
// truck owner names a price, and says back what we return. Decisions use the
// load's shared board, so a rate another agent has locked lowers this one's
// budget the moment it happens.
import { declineStatus, quoteGuard, recordLock, recordOutbid, termsFor } from "@/lib/board.ts";
import { parseRupees, readParams, toolAuthorized } from "@/lib/bolna.ts";
import { decide, sayFor } from "@/lib/negotiate.ts";
import { findCall } from "@/lib/store.ts";

export async function POST(req: Request) {
  if (!toolAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const p = await readParams(req);
  const found = findCall(p.load_id, p.call_id);
  if (!found) return Response.json({ error: "Unknown load or call. Tell the owner you'll call back." }, { status: 404 });

  const { load, call } = found;
  const quote = parseRupees(p.quote);
  if (!(quote > 0)) {
    return Response.json({ action: "ask_again", say: "Maaf kijiye, rate dobara bataiye? Kitne rupaye?" });
  }

  const guarded = quoteGuard(call, quote);
  if (guarded) return Response.json(guarded);

  const isFinal = /^(true|yes|1|haan)$/i.test(p.is_final ?? "");
  const terms = termsFor(load, call);
  const decision = decide(terms, { offers: call.offers, quotes: call.quotes }, quote, isFinal);
  const now = Date.now();
  call.quotes.push(quote);
  call.status = "talking";

  if (decision.action === "counter") {
    call.offers.push(decision.offer);
    call.rival = terms.rival;
  }
  if (decision.action === "accept") {
    call.agreedRate = decision.rate;
    recordLock(load, call, now);
  }
  if (decision.action === "decline") {
    call.status = declineStatus(load, call, terms.rival);
    if (call.status === "outbid") recordOutbid(load, call, terms.rival!, now);
  }

  const name = call.contact.name.split(" ")[0];
  return Response.json({ ...decision, rival: terms.rival ?? null, say: sayFor(decision, name, terms.rival) });
}

export const GET = POST;
