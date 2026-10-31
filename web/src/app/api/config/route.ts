import { connection } from "next/server";
import { bolnaConfigured, intakeConfigured } from "@/lib/bolna.ts";
import { hasPhone } from "@/lib/loads.ts";
import { network } from "@/lib/network.ts";
import { instanceId } from "@/lib/store.ts";

export async function GET() {
  await connection();
  return Response.json({
    live: bolnaConfigured(),
    intake: intakeConfigured(),
    instance: instanceId(),
    // Only the last digits: this route has no login.
    phoneIn: network()
      .filter(hasPhone)
      .map((c) => `••••${c.phone.replace(/\D/g, "").slice(-4)}`),
  });
}
