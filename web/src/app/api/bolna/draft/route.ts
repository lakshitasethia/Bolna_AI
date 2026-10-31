// Bolna custom function `save_details`: the intake agent calls this as the
// transporter talks, and the desk polls it to fill the form during the call.
import { readParams, toolAuthorized } from "@/lib/bolna.ts";
import { draftFrom } from "@/lib/draft.ts";
import { draftForSession, saveDraft } from "@/lib/store.ts";

export async function POST(req: Request) {
  if (!toolAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const p = await readParams(req);
  // The context variable arrives unfilled ("{session_id}") on a call without a desk.
  if (p.session_id && !/[{}%]/.test(p.session_id)) saveDraft(p.session_id, draftFrom(p));
  return Response.json({ ok: true });
}

export async function GET(req: Request) {
  const session = new URL(req.url).searchParams.get("session");
  return Response.json(session ? draftForSession(session) : {});
}
