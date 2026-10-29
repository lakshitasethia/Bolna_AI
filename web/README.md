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
| `src/lib/loads.ts` | Creates loads; once every call ends, books the cheapest truck that agreed |
| `src/app/api/loads` | Post a load (`POST`), poll its calls (`GET /api/loads/:id`) |
| `src/app/api/bolna/quote` | Bolna tool `submit_quote`: owner named a price, returns counter/accept/decline |
| `src/app/api/bolna/outcome` | Bolna tool `report_outcome`: refuses any rate our rules didn't produce |
| `src/app/api/bolna/webhook` | Bolna call status + transcript |
| `../agent/bhaada-agent.md` | Agent prompt, tool JSON, and live-call setup |

## Live calls

Copy `.env.local.example` to `.env.local`, fill in the Bolna keys, and follow
`../agent/bhaada-agent.md`. The store is in memory, so run a single process
(local dev plus a tunnel) for the live demo.
