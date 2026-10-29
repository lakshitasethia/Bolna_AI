import { connection } from "next/server";
import { bolnaConfigured } from "@/lib/bolna.ts";

export async function GET() {
  await connection();
  return Response.json({ live: bolnaConfigured() });
}
