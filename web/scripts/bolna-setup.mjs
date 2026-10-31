// Creates (or updates) Bhaada's two Bolna agents and points their tools and
// webhook at PUBLIC_URL. Reads web/.env.local, prints the agent ids to add.
//
//   node scripts/bolna-setup.mjs            create or update both agents
//   node scripts/bolna-setup.mjs --print    print the agent JSON, call nothing
//
// Env: BOLNA_API_KEY, PUBLIC_URL, BHAADA_TOOL_TOKEN, and optionally
// BOLNA_AGENT_ID / BOLNA_INTAKE_AGENT_ID (update instead of create) and
// BHAADA_TTS_VOICE (a Custom TTS voice registered in Bolna, e.g. Chatterbox).
import { readFileSync } from "node:fs";
import {
  CALLER_PROMPT,
  CALLER_WELCOME,
  callerTools,
  INTAKE_PROMPT,
  INTAKE_WELCOME,
  intakeTools,
} from "./agents.mjs";

const API = "https://api.bolna.ai";
const TRUCK_WORDS = "container, 32 foot, 20 foot, 24 foot, open body, trailer, taurus, Eicher, Tata, Ashok Leyland, canter, LPT";

function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env.local: rely on the shell.
  }
}

// A Hindi voice: Chatterbox through Bolna's Custom TTS when one is registered,
// otherwise Sarvam's Bulbul, which Bolna hosts.
function synthesizer() {
  const voice = process.env.BHAADA_TTS_VOICE;
  if (voice) {
    return { provider: "custom", provider_config: { voice, model: "custom" }, stream: true, buffer_size: 150, audio_format: "wav" };
  }
  return {
    provider: "sarvam",
    provider_config: { voice: "Suhani", voice_id: "suhani", model: "bulbul:v3", language: "hi" },
    stream: true,
    buffer_size: 150,
    audio_format: "wav",
  };
}

function agentBody({ name, welcome, prompt, tools, webhook, maxSeconds, hints }) {
  return {
    agent_config: {
      agent_name: name,
      agent_welcome_message: welcome,
      webhook_url: webhook,
      tasks: [
        {
          task_type: "conversation",
          toolchain: { execution: "sequential", pipelines: [["transcriber", "llm", "synthesizer"]] },
          tools_config: {
            llm_agent: {
              agent_type: "simple_llm_agent",
              agent_flow_type: "streaming",
              // Reasoning tokens count against max_tokens on GPT-5; at 200 the model could
              // spend them all on a turn full of digits, say nothing, and the line went dead.
              llm_config: { provider: "openai", model: "gpt-5.4-mini", max_tokens: 800, temperature: 1 },
            },
            synthesizer: synthesizer(),
            transcriber: {
              provider: "sarvam",
              model: "saaras:v4",
              language: "hi",
              stream: true,
              encoding: "linear16",
              sampling_rate: 16000,
              // Owners pause between the parts of a number; shorter waits cut them into fragments.
              endpointing: 1000,
              context: hints.context,
              keywords: hints.keywords,
            },
            input: { provider: "plivo", format: "wav" },
            output: { provider: "plivo", format: "wav" },
            api_tools: {
              tools: tools.map((t) => t.definition),
              tools_params: Object.fromEntries(tools.map((t) => [t.definition.name, t.params])),
            },
          },
          task_config: {
            call_terminate: maxSeconds,
            hangup_after_silence: 15,
            hangup_after_LLMCall: true,
            call_cancellation_prompt:
              "End the call only if the assistant has given its final thanks after the outcome was decided, or the other person has said goodbye. Otherwise keep the call going.",
            incremental_delay: 1500,
            check_if_user_online: true,
            check_user_online_message: "जी, आप सुन रहे हैं?",
            trigger_user_online_message_after: 10,
          },
        },
      ],
    },
    agent_prompts: { task_1: { system_prompt: prompt } },
  };
}

async function bolna(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.BOLNA_API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function upsert(id, body) {
  if (id) {
    await bolna("PUT", `/v2/agent/${id}`, body);
    return id;
  }
  return (await bolna("POST", "/v2/agent", body)).agent_id;
}

loadEnv();
const host = (process.env.PUBLIC_URL ?? "").replace(/\/$/, "");
const token = process.env.BHAADA_TOOL_TOKEN ?? "";
const print = process.argv.includes("--print");

if (!host.startsWith("https://")) throw new Error("Set PUBLIC_URL to the https tunnel or deploy URL, e.g. https://abc.trycloudflare.com");
if (!token) throw new Error("Set BHAADA_TOOL_TOKEN (any long random string) so Bolna's tool calls are authenticated");

const caller = agentBody({
  name: "Bhaada caller",
  welcome: CALLER_WELCOME,
  prompt: CALLER_PROMPT,
  tools: callerTools(host, token),
  webhook: `${host}/api/bolna/webhook`,
  maxSeconds: 240,
  hints: {
    context:
      "Hindi phone call with an Indian truck owner about a freight load. They name rates in rupees, read out a vehicle number like MH 12 AB 1234 letter by letter, and a ten digit mobile number digit by digit.",
    keywords: `${TRUCK_WORDS}, MH, DL, HR, RJ, UP, GJ, KA, PB, MP, TN, AP, TS, KL, WB, BR, CG, OD, JH, UK, HP, JK, AS, GA, ek, do, teen, chaar, paanch, chhah, saat, aath, nau, shunya, hazaar, lakh, driver, gaadi`,
  },
});
const intake = agentBody({
  name: "Bhaada intake",
  welcome: INTAKE_WELCOME,
  prompt: INTAKE_PROMPT,
  tools: intakeTools(host, token),
  webhook: `${host}/api/bolna/webhook`,
  maxSeconds: 240,
  hints: {
    context:
      "Hindi phone call where a transporter posts a freight load: pickup and drop cities in India, a pickup time, a truck type and size, a weight in tons, and a maximum rate in rupees.",
    keywords: `${TRUCK_WORDS}, ton, hazaar, lakh, Okhla, Delhi, Jaipur, Mumbai, Pune, Ahmedabad, Ludhiana, Bihar`,
  },
});

if (print) {
  console.log(JSON.stringify({ caller, intake }, null, 2));
} else {
  if (!process.env.BOLNA_API_KEY) throw new Error("Set BOLNA_API_KEY");
  const callerId = await upsert(process.env.BOLNA_AGENT_ID, caller);
  const intakeId = await upsert(process.env.BOLNA_INTAKE_AGENT_ID, intake);
  console.log("Agents ready. Put these in web/.env.local and restart the dev server:\n");
  console.log(`BOLNA_AGENT_ID=${callerId}`);
  console.log(`BOLNA_INTAKE_AGENT_ID=${intakeId}`);
}
