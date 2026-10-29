// Bolna agent webhook: call status updates and the final transcript.
import { settleAndNotify } from "@/lib/finish.ts";
import { isDone } from "@/lib/loads.ts";
import { findCallByExecution } from "@/lib/store.ts";
import type { Turn } from "@/lib/types.ts";

interface Execution {
  id?: string;
  execution_id?: string;
  status?: string;
  transcript?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Execution | null;
  const executionId = body?.execution_id ?? body?.id;
  const found = executionId ? findCallByExecution(executionId) : undefined;
  if (!body || !found) return Response.json({ ok: true, ignored: true });

  const { load, call } = found;
  const now = Date.now();

  if (body.transcript) call.transcript = parseTranscript(body.transcript, now);

  if (!isDone(call)) {
    switch (body.status) {
      case "ringing":
      case "initiated":
        call.status = "ringing";
        break;
      case "in-progress":
        call.status = "talking";
        break;
      case "no-answer":
      case "busy":
        call.status = "no_answer";
        call.endedAt = now;
        break;
      case "failed":
      case "error":
      case "canceled":
        call.status = "failed";
        call.endedAt = now;
        break;
      case "completed":
      case "call-disconnected":
        // The agent hung up without reporting an outcome.
        call.status = "call_later";
        call.endedAt = now;
        break;
    }
  }

  await settleAndNotify(load);
  return Response.json({ ok: true });
}

// Bolna transcripts look like "assistant: ...\nuser: ...".
function parseTranscript(raw: string, at: number): Turn[] {
  return raw
    .split("\n")
    .map((line) => line.match(/^\s*(assistant|agent|user)\s*:\s*(.+)$/i))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ who: /user/i.test(m[1]) ? "owner" : "agent", text: m[2].trim(), at }));
}
