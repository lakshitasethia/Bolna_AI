// Mints a one-time Bolna web call session for the intake agent, so a
// transporter can phone in from the desk without a phone number.
import { intakeConfigured } from "@/lib/bolna.ts";
import { hasPhone } from "@/lib/loads.ts";
import { rememberIntakeRun, rememberOwners } from "@/lib/store.ts";
import type { Contact } from "@/lib/types.ts";

export async function POST(req: Request) {
  if (!intakeConfigured()) {
    return Response.json({ error: "Phone-in needs BOLNA_API_KEY and BOLNA_INTAKE_AGENT_ID on the server." }, { status: 503 });
  }
  const { user_data } = ((await req.json().catch(() => ({}))) ?? {}) as { user_data?: Record<string, string> };
  // Numbers typed on the desk stay on this server; the voice agent never needs them.
  const { owners, ...agentData } = user_data ?? {};
  const res = await fetch("https://api.bolna.ai/web-call/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.BOLNA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: process.env.BOLNA_INTAKE_AGENT_ID, user_data: agentData }),
  });
  const text = await res.text();
  const runId = (JSON.parse(text || "{}") as { run_id?: string }).run_id;
  if (res.ok && runId && agentData.session_id) {
    rememberIntakeRun(runId, agentData.session_id);
    rememberOwners(agentData.session_id, typedOwners(owners));
  }
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}

function typedOwners(raw?: string): Contact[] {
  try {
    const owners = JSON.parse(raw ?? "[]") as Contact[];
    return Array.isArray(owners) ? owners.filter((o) => typeof o?.phone === "string" && hasPhone(o)) : [];
  } catch {
    return [];
  }
}
