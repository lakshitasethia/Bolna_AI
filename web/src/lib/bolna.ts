import type { Call, Load } from "./types.ts";

const API = "https://api.bolna.ai";

export const bolnaConfigured = () => Boolean(process.env.BOLNA_API_KEY && process.env.BOLNA_AGENT_ID);

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

export function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
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

// "₹38,500" / "38500" / "38.5k" / "38 hazaar" -> 38500
export function parseRupees(raw: string | undefined): number {
  if (!raw) return NaN;
  const s = raw.toLowerCase().replace(/[₹,\s]/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)(k|hazaar|hazar|thousand)?$/);
  if (!m) return NaN;
  const n = Number(m[1]);
  return Math.round(m[2] ? n * 1000 : n);
}
