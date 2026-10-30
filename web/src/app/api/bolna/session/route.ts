// Mints a one-time Bolna web call session for the intake agent, so a
// transporter can phone in from the desk without a phone number.
import { intakeConfigured } from "@/lib/bolna.ts";
import { rememberIntakeRun } from "@/lib/store.ts";

export async function POST(req: Request) {
  if (!intakeConfigured()) {
    return Response.json({ error: "Phone-in needs BOLNA_API_KEY and BOLNA_INTAKE_AGENT_ID on the server." }, { status: 503 });
  }
  const { user_data } = ((await req.json().catch(() => ({}))) ?? {}) as { user_data?: Record<string, string> };
  const res = await fetch("https://api.bolna.ai/web-call/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.BOLNA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: process.env.BOLNA_INTAKE_AGENT_ID, user_data }),
  });
  const text = await res.text();
  const runId = (JSON.parse(text || "{}") as { run_id?: string }).run_id;
  if (res.ok && runId && user_data?.session_id) rememberIntakeRun(runId, user_data.session_id);
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
