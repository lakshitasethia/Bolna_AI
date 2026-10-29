import { bolnaConfigured, placeCall } from "@/lib/bolna.ts";
import { createLoad } from "@/lib/loads.ts";
import { startSim } from "@/lib/simulate.ts";
import { saveLoad } from "@/lib/store.ts";
import type { LoadInput } from "@/lib/types.ts";

export async function POST(req: Request) {
  const input = (await req.json().catch(() => null)) as LoadInput | null;
  const problem = validate(input);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const load = createLoad(input!);
  saveLoad(load);

  if (load.mode === "sim") {
    startSim(load);
  } else {
    await Promise.all(
      load.calls.map(async (call) => {
        try {
          call.executionId = await placeCall(load, call);
          call.status = "ringing";
          call.startedAt = Date.now();
        } catch (err) {
          call.status = "failed";
          call.endedAt = Date.now();
          call.transcript.push({ who: "agent", text: `Call not placed: ${(err as Error).message}`, at: Date.now() });
        }
      }),
    );
  }

  return Response.json(load, { status: 201 });
}

function validate(input: LoadInput | null): string | null {
  if (!input) return "Send the load as JSON.";
  if (!input.from?.trim() || !input.to?.trim()) return "Add both pickup and drop places.";
  if (!(input.target > 0) || !(input.ceiling > 0)) return "Set an opening rate and a maximum rate.";
  if (input.target > input.ceiling) return "The opening rate has to be at or below the maximum rate.";
  if (!input.contacts?.length) return "Add at least one truck owner to call.";
  if (input.mode === "live") {
    if (!bolnaConfigured()) return "Live calls need BOLNA_API_KEY and BOLNA_AGENT_ID on the server.";
    if (input.contacts.some((c) => c.phone.replace(/\D/g, "").length < 10)) {
      return "Every owner needs a 10-digit phone number for live calls.";
    }
  }
  return null;
}
