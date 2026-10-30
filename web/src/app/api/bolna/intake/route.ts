// Bolna custom function `post_load` on the intake agent: the transporter phones
// in, says the load in Hindi, and the agent calls this once they've confirmed
// it. One call in starts an agent on every owner in the network.
import { bolnaConfigured, parseRupees, readParams, toolAuthorized } from "@/lib/bolna.ts";
import { DEMO_LOAD } from "@/lib/demo.ts";
import { dispatch } from "@/lib/dispatch.ts";
import { createLoad, hasPhone } from "@/lib/loads.ts";
import { STEP } from "@/lib/negotiate.ts";
import { network } from "@/lib/network.ts";
import { latestForSession, saveLoad } from "@/lib/store.ts";

// The agent can call the tool twice on one phone-in; the second call reuses the load.
const REPEAT_WINDOW = 3 * 60_000;

// Context variables arrive unfilled ("{session_id}") on a phone call that didn't set them.
const known = (v?: string) => (v && !/[{}%]/.test(v) ? v.trim() || undefined : undefined);

export async function POST(req: Request) {
  if (!toolAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const p = await readParams(req);
  const ceiling = parseRupees(p.max_rate);
  const from = p.pickup_place?.trim();
  const to = p.drop_place?.trim();
  if (!from || !to || !(ceiling > 0)) {
    return Response.json({
      ok: false,
      say: "Ek baar pickup, drop aur aapka maximum rate dobara bata dijiye?",
    });
  }

  const session = known(p.session_id) ?? known(p.from_number);
  const recent = session ? latestForSession(session) : undefined;
  if (recent && Date.now() - recent.createdAt < REPEAT_WINDOW && recent.from === from && recent.to === to) {
    return Response.json({ ok: true, load_id: recent.id, owners: recent.calls.length, say: postedLine(recent.calls.length) });
  }

  // Open around 8% under the maximum unless the transporter named an opening rate.
  const asked = parseRupees(p.target_rate);
  const target = asked > 0 && asked <= ceiling ? asked : Math.round((ceiling * 0.92) / STEP) * STEP;
  const contacts = network();

  const load = createLoad({
    transporter: known(p.transporter) ?? DEMO_LOAD.transporter,
    from,
    to,
    pickup: p.pickup_time?.trim() || "jaldi",
    truck: p.truck?.trim() || DEMO_LOAD.truck,
    weightTons: Number(p.weight_tons) > 0 ? Number(p.weight_tons) : DEMO_LOAD.weightTons,
    target,
    ceiling,
    contacts,
    mode: bolnaConfigured() && contacts.some(hasPhone) ? "live" : "sim",
    source: "phone",
    session,
    transporterPhone: known(p.from_number),
  });
  saveLoad(load);
  await dispatch(load);

  return Response.json({ ok: true, load_id: load.id, owners: load.calls.length, say: postedLine(load.calls.length) });
}

export const GET = POST;

const postedLine = (n: number) =>
  `Load post ho gaya. ${n} gaadi waalon ko ek saath call kar rahi hoon. Sabse sasti gaadi book karke aapko confirm karti hoon.`;
