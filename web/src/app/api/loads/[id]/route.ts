import { settleAndNotify } from "@/lib/finish.ts";
import { advance } from "@/lib/simulate.ts";
import { getLoad } from "@/lib/store.ts";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const load = getLoad(id);
  if (!load) return Response.json({ error: "No load with that id. The server may have restarted." }, { status: 404 });

  const wasCalling = load.status === "calling";
  advance(load);
  if (wasCalling) await settleAndNotify(load);

  return Response.json(load);
}
