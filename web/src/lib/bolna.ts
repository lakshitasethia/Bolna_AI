import type { Call, Load } from "./types.ts";
import { normalizeMobile } from "./vehicle.ts";

const API = "https://api.bolna.ai";

export const bolnaConfigured = () => Boolean(process.env.BOLNA_API_KEY && process.env.BOLNA_AGENT_ID);
export const intakeConfigured = () => Boolean(process.env.BOLNA_API_KEY && process.env.BOLNA_INTAKE_AGENT_ID);

// Places one outbound call. The agent prompt reads these user_data fields as
// {load_id}, {call_id}, {owner_name} and so on (see agent/bhaada-agent.md).
export async function placeCall(load: Load, call: Call) {
  const res = await fetch(`${API}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: process.env.BOLNA_AGENT_ID,
      recipient_phone_number: toE164(call.contact.phone),
      user_data: {
        load_id: load.id,
        call_id: call.id,
        agent_letter: call.agent,
        owner_name: call.contact.name.split(" ")[0],
        transporter: load.transporter,
        pickup_place: load.from,
        drop_place: load.to,
        pickup_time: load.pickup,
        truck: load.truck,
        weight_tons: String(load.weightTons),
      },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { execution_id?: string; message?: string };
  if (!res.ok || !body.execution_id) {
    throw new Error(body.message ?? `Bolna returned ${res.status}`);
  }
  return body.execution_id;
}

// Where Bolna sends this agent's calls, or null if the agent doesn't exist.
export async function agentWebhook(id: string | undefined) {
  if (!id) return null;
  const res = await fetch(`${API}/v2/agent/${id}`, {
    headers: { Authorization: `Bearer ${process.env.BOLNA_API_KEY}` },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const agent = (await res.json().catch(() => null)) as { webhook_url?: string } | null;
  return agent?.webhook_url ?? null;
}

export function toE164(phone: string) {
  const mobile = normalizeMobile(phone);
  if (mobile) return `+91${mobile}`;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

// Bolna custom functions send a bearer token we choose (BHAADA_TOOL_TOKEN).
export function toolAuthorized(req: Request) {
  const token = process.env.BHAADA_TOOL_TOKEN;
  if (!token) return true;
  return req.headers.get("authorization") === `Bearer ${token}`;
}

// Tool params can arrive as a JSON body or a query string; accept both.
export async function readParams(req: Request): Promise<Record<string, string>> {
  const params: Record<string, string> = Object.fromEntries(new URL(req.url).searchParams);
  if (req.method !== "GET") {
    const body = await req.json().catch(() => null);
    if (body && typeof body === "object") {
      for (const [k, v] of Object.entries(body)) params[k] = String(v);
    }
  }
  return params;
}

// "₹38,500" / "38500" / "38.5k" / "38 hazaar" / "38 हज़ार रुपये" -> 38500
export function parseRupees(raw: string | undefined): number {
  if (!raw) return NaN;
  const s = raw
    .normalize("NFC")
    .toLowerCase()
    .replace(/[₹,\s।]|\/-|rs\.?|rupees?|rupaye|रुपये|रुपए|रुपया/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)(k|hazaar|hazar|thousand|lakh|lac|हज़?ार|लाख)?$/);
  if (!m) return NaN;
  const n = Number(m[1]);
  if (m[2] === "lakh" || m[2] === "lac" || m[2] === "लाख") return Math.round(n * 100000);
  return Math.round(m[2] ? n * 1000 : n);
}
