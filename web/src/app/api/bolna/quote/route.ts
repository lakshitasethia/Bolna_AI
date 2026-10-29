// Bolna custom function `submit_quote`: the agent calls this every time the
// truck owner names a price, and says back what we return.
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
  if (!Number.isFinite(quote)) {
    return Response.json({ action: "ask_again", say: "Maaf kijiye, rate dobara bataiye? Kitne rupaye?" });
  }

  const isFinal = /^(true|yes|1|haan)$/i.test(p.is_final ?? "");
  const decision = decide(load, { offers: call.offers, quotes: call.quotes }, quote, isFinal);
  call.quotes.push(quote);
  call.status = "talking";

  if (decision.action === "counter") call.offers.push(decision.offer);
  if (decision.action === "accept") call.agreedRate = decision.rate;
  if (decision.action === "decline") call.status = "too_expensive";

  const name = call.contact.name.split(" ")[0];
  return Response.json({ ...decision, say: sayFor(decision, name) });
}

export const GET = POST;
