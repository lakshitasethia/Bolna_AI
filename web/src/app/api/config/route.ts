import { connection } from "next/server";
import { bolnaConfigured, intakeConfigured } from "@/lib/bolna.ts";

export async function GET() {
  await connection();
  return Response.json({ live: bolnaConfigured(), intake: intakeConfigured() });
}
