import { deskAuthorized, isDeskSession, passcodeSet, publicLoad } from "@/lib/access.ts";
import { bolnaConfigured } from "@/lib/bolna.ts";
import { dispatch } from "@/lib/dispatch.ts";
import { createLoad, hasPhone } from "@/lib/loads.ts";
import { latestForSession, saveLoad } from "@/lib/store.ts";
import type { LoadInput } from "@/lib/types.ts";

// The desk polls this after a phone-in, to find the load the transporter just posted.
export async function GET(req: Request) {
  const session = new URL(req.url).searchParams.get("session");
  const load = isDeskSession(session) ? latestForSession(session) : undefined;
  return load ? Response.json(publicLoad(load)) : Response.json({ error: "No load yet." }, { status: 404 });
}

export async function POST(req: Request) {
  const input = (await req.json().catch(() => null)) as LoadInput | null;
  const problem = validate(input);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  // Real calls ring real phones and spend Bolna credits, so they need the desk passcode.
  if (input!.mode === "live") {
    if (!passcodeSet()) {
      return Response.json({ error: "Real calls are off: set BHAADA_DESK_PASSCODE on the server." }, { status: 503 });
    }
    if (!deskAuthorized(req)) {
      return Response.json({ error: "Enter the desk passcode to place real calls." }, { status: 401 });
    }
  }

  const load = createLoad(input!);
  saveLoad(load);

  await dispatch(load);

  return Response.json(publicLoad(load), { status: 201 });
}

function validate(input: LoadInput | null): string | null {
  if (!input) return "Send the load as JSON.";
  if (!input.from?.trim() || !input.to?.trim()) return "Add both pickup and drop places.";
  if (!(input.target > 0) || !(input.ceiling > 0)) return "Set an opening rate and a maximum rate.";
  if (input.target > input.ceiling) return "The opening rate has to be at or below the maximum rate.";
  if (!input.contacts?.length) return "Add at least one truck owner to call.";
  if (input.mode === "live") {
    if (!bolnaConfigured()) return "Live calls need BOLNA_API_KEY and BOLNA_AGENT_ID on the server.";
    const bad = input.contacts.find((c) => c.phone.trim() && !hasPhone(c));
    if (bad) return `${bad.name || "An owner"} has a phone number that isn't valid: ${bad.phone}. Use 10 digits.`;
    if (!input.contacts.some(hasPhone)) return "Add a 10-digit phone number for at least one owner.";
    if (input.contacts.some((c) => !hasPhone(c) && !c.persona)) {
      return "Owners without a phone number are simulated, so they need a simulated persona.";
    }
  }
  return null;
}
