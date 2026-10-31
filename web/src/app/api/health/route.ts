// The desk's "ready" check: are both agents there, and do they reach this server?
import { connection } from "next/server";
import { agentWebhook } from "@/lib/bolna.ts";
import { instanceId } from "@/lib/store.ts";

// The agents' webhook host has to answer as this very process. Anything else
// means a dead tunnel, or agents pointed at another deployment.
async function reachesThisServer(webhook: string | null) {
  if (!webhook) return false;
  const res = await fetch(new URL("/api/config", webhook), { signal: AbortSignal.timeout(8000) }).catch(() => null);
  const config = (await res?.json().catch(() => null)) as { instance?: string } | null;
  return config?.instance === instanceId();
}

export async function GET() {
  await connection();
  const [caller, intake] = await Promise.all([
    agentWebhook(process.env.BOLNA_AGENT_ID),
    agentWebhook(process.env.BOLNA_INTAKE_AGENT_ID),
  ]);
  const [callerLinked, intakeLinked] = await Promise.all([reachesThisServer(caller), reachesThisServer(intake)]);
  return Response.json({ caller: Boolean(caller), intake: Boolean(intake), linked: callerLinked && intakeLinked });
}
