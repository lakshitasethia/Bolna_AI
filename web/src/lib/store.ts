import type { LoadDraft } from "./draft.ts";
import type { Call, Contact, Load } from "./types.ts";

// In-memory store. Good for one process (local dev, or one tunnel for the live
// demo). Swap for Redis/Postgres before running on multiple serverless instances.
const g = globalThis as unknown as {
  __bhaada?: Map<string, Load>;
  __bhaadaRuns?: Map<string, string>;
  __bhaadaOwners?: Map<string, Contact[]>;
  __bhaadaDrafts?: Map<string, LoadDraft>;
  __bhaadaInstance?: string;
};
const loads = (g.__bhaada ??= new Map<string, Load>());
// Web call run id -> desk session, so the phone-in transcript finds its load.
const intakeRuns = (g.__bhaadaRuns ??= new Map<string, string>());
// Desk session -> owners typed on the desk, so a phone-in calls them too.
const sessionOwners = (g.__bhaadaOwners ??= new Map<string, Contact[]>());
// Desk session -> what the transporter has said so far on the phone-in.
const drafts = (g.__bhaadaDrafts ??= new Map<string, LoadDraft>());

// Names this process, so the health check can tell it's really the one Bolna reaches.
export const instanceId = () => (g.__bhaadaInstance ??= Math.random().toString(36).slice(2));

export const rememberIntakeRun =(runId: string, session: string) => void intakeRuns.set(runId, session);
export const intakeSession = (runId: string) => intakeRuns.get(runId);
export const rememberOwners = (session: string, owners: Contact[]) => void sessionOwners.set(session, owners);
export const ownersForSession = (session?: string) => (session && sessionOwners.get(session)) || [];
export const saveDraft = (session: string, draft: LoadDraft) =>
  void drafts.set(session, { ...drafts.get(session), ...draft });
export const draftForSession = (session: string) => drafts.get(session) ?? {};

export const saveLoad = (load: Load) => void loads.set(load.id, load);
export const getLoad = (id: string) => loads.get(id);

export function findCall(loadId: string, callId: string): { load: Load; call: Call } | undefined {
  const load = loads.get(loadId);
  const call = load?.calls.find((c) => c.id === callId);
  return load && call ? { load, call } : undefined;
}

export function findCallByExecution(executionId: string): { load: Load; call: Call } | undefined {
  for (const load of loads.values()) {
    const call = load.calls.find((c) => c.executionId === executionId);
    if (call) return { load, call };
  }
}

export function latestForSession(session: string): Load | undefined {
  let latest: Load | undefined;
  for (const load of loads.values()) {
    if (load.session === session && (!latest || load.createdAt > latest.createdAt)) latest = load;
  }
  return latest;
}
