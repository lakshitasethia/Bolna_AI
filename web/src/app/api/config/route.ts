import { connection } from "next/server";
import { deskAuthorized, maskPhone, passcodeSet } from "@/lib/access.ts";
import { bolnaConfigured, intakeConfigured } from "@/lib/bolna.ts";
import { hasPhone } from "@/lib/loads.ts";
import { network } from "@/lib/network.ts";
import { instanceId } from "@/lib/store.ts";

export async function GET(req: Request) {
  await connection();
  const unlocked = deskAuthorized(req);
  return Response.json({
    // Real calls and phone-in stay off until the server has a desk passcode.
    live: bolnaConfigured() && passcodeSet(),
    intake: intakeConfigured() && passcodeSet(),
    unlocked,
    instance: instanceId(),
    // Which phones a phone-in rings, only for someone with the passcode.
    phoneIn: unlocked ? network().filter(hasPhone).map((c) => maskPhone(c.phone)) : [],
  });
}
