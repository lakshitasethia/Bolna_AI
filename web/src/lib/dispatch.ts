import { placeCall } from "./bolna.ts";
import { startSim } from "./simulate.ts";
import type { Load } from "./types.ts";

// Starts every agent on a load at once: real Bolna calls for owners with a
// number, simulated owners for the rest. Bolna queues any calls past the
// account's concurrency limit and dials them as lines free up.
export async function dispatch(load: Load) {
  startSim(load);
  await Promise.all(
    load.calls
      .filter((call) => call.live)
      .map(async (call) => {
        try {
          call.executionId = await placeCall(load, call);
          call.status = "ringing";
          call.startedAt = Date.now();
        } catch (err) {
          call.status = "failed";
          call.endedAt = Date.now();
          call.transcript.push({ who: "agent", text: `Call not placed: ${(err as Error).message}`, at: Date.now() });
        }
      }),
  );
}
