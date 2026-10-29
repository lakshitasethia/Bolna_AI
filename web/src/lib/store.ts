import type { Call, Load } from "./types.ts";

// In-memory store. Good for one process (local dev, or one tunnel for the live
// demo). Swap for Redis/Postgres before running on multiple serverless instances.
const g = globalThis as unknown as { __bhaada?: Map<string, Load> };
const loads = (g.__bhaada ??= new Map<string, Load>());

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
