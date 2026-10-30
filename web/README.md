# Bhaada web

Landing page, the `/desk` demo, and the backend Bolna calls during a conversation.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # negotiation + simulation checks, no calls made
```

## What's where

| Path | What it does |
|---|---|
| `src/lib/negotiate.ts` | The price rules: open at target, meet halfway in ₹500 steps, never above the ceiling |
| `src/lib/simulate.ts` | Simulated truck owners, so the desk demos without spending call minutes |
| `src/lib/loads.ts` | Creates loads (one agent per owner); once every call ends, books the cheapest truck that agreed |
| `src/lib/board.ts` | The agents' shared board: a locked rate caps every other agent and becomes their leverage |
| `src/lib/dispatch.ts` | Starts every agent at once: real Bolna calls for owners with a number, simulated for the rest |
| `src/lib/network.ts` | The transporter's owners; real numbers come from `BHAADA_OWNER_PHONES` |
| `src/app/api/loads` | Post a load (`POST`), find a phoned-in load (`GET ?session=`), poll it (`GET /api/loads/:id`) |
| `src/app/api/bolna/intake` | Bolna tool `post_load` on the intake agent: the transporter phoned in a load |
| `src/app/api/bolna/session` | Mints a Bolna web call so the desk can phone the intake agent from the browser |
| `src/app/api/bolna/quote` | Bolna tool `submit_quote`: owner named a price, returns counter/accept/decline |
| `src/app/api/bolna/outcome` | Bolna tool `report_outcome`: refuses any rate our rules didn't produce |
| `src/app/api/bolna/webhook` | Bolna call status + transcript |
| `scripts/agents.mjs` | Both agents' prompts and tool definitions |
| `scripts/bolna-setup.mjs` | Creates or updates the two Bolna agents from your key |
| `../agent/bhaada-agent.md` | How it fits together, and live-call setup |
| `../tts/` | Chatterbox Hindi voice behind Bolna's Custom TTS |

## Live calls

Copy `.env.local.example` to `.env.local`, fill in the Bolna keys, and follow
`../agent/bhaada-agent.md`. The store is in memory, so run a single process
(local dev plus a tunnel) for the live demo.
