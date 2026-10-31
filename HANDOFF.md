# Bhaada: project status and handoff

For whoever continues this project. Last updated 31 Oct 2026. Read [README.md](README.md) first for what the product is and how it works.

**Where it stands:** the main booking flow is deployed and has completed one real call from negotiation to booked truck. It is a demo, not a production system: data is held in memory, owners are a hard-coded list, and the public site has no login.

## Key dates

- **31 Oct 2026:** Buildathon submission deadline. Whether the submission has gone in isn't recorded in this repo, so check with the project owner.
- **20 Nov 2026:** the top 3 teams pitch in Bengaluru.

The project has been built on free tiers only.

## What is deployed

| Piece | Where | State | Notes |
|---|---|---|---|
| Web app and API | Render web service, https://bolna-ai.onrender.com | Live | Free instance, Node 24 |
| Bolna caller agent, "Bhaada caller" | Bolna account | Live, points at Render | Rings the owners |
| Bolna intake agent, "Bhaada intake" | Bolna account | Live, points at Render | Takes the transporter's call |
| Voice | Sarvam `bulbul:v3`, voice Suhani, hosted through Bolna | In use | |
| Source | https://github.com/lakshitasethia/Bolna_AI, `main` | Public repo | |
| Chatterbox voice | Google Colab | **Not running** | The voices registered in Bolna point at dead tunnels. Don't select them |
| Telegram alerts | | **Not set up** | The code is there, but the bot token and chat id are empty |
| Vercel | | **Not used** | Serverless instances wouldn't share the in-memory store |

### Render settings

| Field | Value |
|---|---|
| Language | Node |
| Branch | `main` |
| Root directory | `web` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Instance type | Free |

Environment variables on Render: `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `BOLNA_INTAKE_AGENT_ID`, `BHAADA_TOOL_TOKEN`, `BHAADA_OWNER_PHONES`, and `NODE_VERSION=24`.

### Things that will catch you out

- **A push doesn't update the agents.** Render deploys the app from `main`, but the prompts and settings in `web/scripts/` live on Bolna. After changing them, run `cd web && node scripts/bolna-setup.mjs`. It updates the agents on Bolna straight away, so any later call picks up the change.
- **The setup script reads `web/.env.local`.** `PUBLIC_URL` there must stay `https://bolna-ai.onrender.com`, or the agents get pointed somewhere else.
- **Every Render restart wipes all loads.** Sleeping and deploying both restart it, so don't push during a live call. After a restart, a call still in progress gets "Unknown load or call" from the tools.
- **The site sleeps when idle.** The first request took 46 seconds when measured on 31 Oct. Open the site a minute or two before a demo.
- **`BHAADA_TOOL_TOKEN` must match.** The setup script stores it in the agents' tools, and Render checks it. Change it in both places, or every tool call returns 401.

## Access you will need

Nothing below is in the repo. Ask the project owner to share it privately.

| What | Why |
|---|---|
| GitHub write access to the repo | Pushing |
| Render access, or your own service using the settings above | Deploys, logs, env vars |
| Bolna login or API key, and both agent ids | Agents, call logs, verifying numbers |
| `web/.env.local` values | Local work and running the setup script |
| Your phone number verified in Bolna | The trial only calls verified numbers |

Two numbers are verified on the trial account now, and `BHAADA_OWNER_PHONES` uses them. **They are real people's phones, so a live load rings them.** Replace them with your own when you take over.

## What is implemented

### Product

| Feature | Where |
|---|---|
| Landing page with GSAP motion and animated line art | `web/src/components/landing/` |
| Booking desk: type a load or phone it in, then watch the calls and price board live | `web/src/app/desk/Desk.tsx`, `web/src/components/` |
| Phone-in from the browser, with no phone number needed | `web/src/app/api/bolna/session/`, `@bolna/web-call` |
| Hindi intake agent that requires every field and reads the load back | `web/scripts/agents.mjs` |
| Six parallel agents per load | `web/src/lib/dispatch.ts` |
| Simulated owners on the same board as real calls | `web/src/lib/simulate.ts`, `web/src/lib/demo.ts` |

### Rules and safety checks

| Feature | Where |
|---|---|
| Price rules with a hard ceiling | `web/src/lib/negotiate.ts` |
| Shared board: a locked rate caps the others and is used as leverage | `web/src/lib/board.ts` |
| Misheard amounts rejected | `plausibleQuote` in `negotiate.ts` |
| An agreed rate can't be pushed up, and a finished call can't be reopened | `quoteGuard` in `board.ts` |
| Only a rate the rules produced can be booked | `web/src/app/api/bolna/outcome/route.ts` |
| Vehicle and driver numbers validated, with two retries, then flagged for a person | `web/src/lib/vehicle.ts` |
| Repeated `post_load` calls don't create a second load | `web/src/app/api/bolna/intake/route.ts` |
| Bearer token on Bolna's tool calls | `toolAuthorized` in `web/src/lib/bolna.ts` |

### Voice tuning

These are in the agent config and come from real call failures:

- Hindi only, written in Devanagari, with amounts as words
- Number pieces collected one at a time, with 700 ms endpointing because owners pause mid-number
- Transcriber hints for truck terms and state codes
- If an owner refuses without naming a price, the agent asks what rate they would take
- Automatic hang-up after the closing line

### Optional Chatterbox voice

`tts/` serves Chatterbox behind the OpenAI speech API for Bolna Custom TTS. It worked on a Colab T4 GPU, at about 7 seconds per sentence once warm and 19 seconds for the first. That lag, plus Colab tunnels that die, is why the agents moved to Sarvam. To use it again, follow [tts/README.md](tts/README.md).

## What has been tested

Checked on 31 Oct 2026:

| Check | Result |
|---|---|
| `npm test` | 30 of 30 pass |
| `npx tsc --noEmit`, `npm run lint`, `npm run build` | Pass |
| Deployed `/`, `/desk`, `/api/config` | Respond, with live calls and phone-in both enabled |
| Tool route without the token | Rejected with 401 |

Flow, stage by stage:

| Stage | State | Evidence |
|---|---|---|
| Phone-in by voice | **Not tested on Render** | A browser session starts. A phone-in posted a load once on a laptop, before the intake prompt was tightened |
| Intake agent posts a load | **Route tested only** | No spoken load has reached it on Render |
| Agents start, including a real call | Tested | One real call alongside five simulated owners |
| Negotiation on a real call | Tested once | A misheard "40" was re-asked, then ₹40,000 was countered at ₹35,000 and accepted |
| Vehicle and driver numbers on a real call | Tested once | Both correct and unflagged |
| Cheapest truck wins | Tested once | Real owner at ₹35,000 beat simulated trucks at ₹35,500 and ₹36,000 |
| Agent hangs up by itself | Tested once | |
| Asks for a rate after a bare "नहीं" | **Not tested on a call** | The owner agreed straight away on the only call since this change |
| Two real owners at once on Render | **Not tested** | |
| Real booking shown on the desk | **Not confirmed** | The call was checked through server data |
| Telegram alert | **Not tested** | Not set up |

The full real call took 110 seconds. One clean call shows the flow can work, not that it is reliable, because speech recognition still mishears numbers.

## What is left

### 1. Before sharing the link widely

The site is public and has no login. This matters more than anything else on this list.

- **Anyone can place calls.** `POST /api/loads` with `mode: "live"` and `POST /api/bolna/session` need no auth, so a visitor can ring phones and spend Bolna credits. A passcode on these two routes was planned but not added.
- **Load data is exposed.** Load responses include owners' phone numbers and the transporter's maximum rate. Anyone who gets a load can read them, so a phoned-in load exposes the numbers in `BHAADA_OWNER_PHONES`. Strip these fields from what the browser receives.
- **The webhook has no auth.** Anyone with an execution id could change a call's status.
- **The tool check fails open.** `toolAuthorized` allows everything if `BHAADA_TOOL_TOKEN` is unset. It should refuse instead.

### 2. Test on real calls

1. Phone in a load by voice on Render through `/desk`.
2. Refuse with a bare "नहीं", to confirm the agent asks for a rate.
3. Run two real owners at once, to confirm the locked rate reaches the second call.
4. Watch the real booking appear on the desk.

### 3. Known bugs

| Bug | Impact |
|---|---|
| The agent skipped the read-back of numbers and rate on the real call, though the prompt requires it | A misheard number wouldn't get caught by the owner |
| When an owner gave a partial answer ("98"), the agent asked for the first five digits twice | Clunky, but it recovered |
| Nothing times out a live call. If Bolna's final webhook never arrives, the load stays "calling" and never books | A load can hang forever |

### 4. Ideas taken off the site

These two were on the landing page as scripted examples. They were never built, so they came off it. Build them before putting them back in `web/src/components/landing/Products.tsx`.

- **Check calls:** calling the driver at pickup and en route, then updating the desk and shipper.
- **Return loads:** an owner phones in about an empty truck and gets matched to a load.

### 5. Needed for a real product

| Gap | Today |
|---|---|
| **Telling people the result** | The agent promises the owner confirmation within ten minutes and tells the transporter details will follow, but no code contacts the winner, the released owners or the transporter. Telegram is the only channel, and it goes to one configured chat |
| **Booking alerts** | Create a bot, then set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` on Render |
| **Database** | The in-memory store loses everything on restart. Redis or Postgres would also allow more than one instance |
| **Owner list** | Six hard-coded demo owners in `web/src/lib/demo.ts`. No per-transporter network and no matching by lane or truck type |
| **Accounts** | Single-tenant, with no transporter login |
| **Real dial-in number** | The browser call stands in for it. A number costs money and Indian numbers need compliance work |
| **Scale** | The Bolna trial allows two concurrent calls to verified numbers. A real six-owner run needs a paid plan |
| **Always-on hosting** | The free Render instance sleeps. A paid instance fixes that |
| **Outbound-calling compliance** | Not looked into. Check the rules for automated calls in India before calling real owners at scale |
| **Tests for the routes and the desk** | Tests cover the rules and simulator. Routes, `dispatch.ts` and the UI have none |

## Working on it safely

**Don't test with `/api/bolna/intake` or a live load unless the people on those phones expect a call.** Intake dials every number in `BHAADA_OWNER_PHONES`. An earlier test did this, rang both phones, and left a fake ₹30,000 lock on the load someone was answering, which then looked like a pricing bug.

Use a simulated load with empty phone numbers instead, either in the desk's simulated mode or like this:

```bash
curl -X POST https://bolna-ai.onrender.com/api/loads \
  -H 'Content-Type: application/json' \
  -d '{"transporter":"Test","from":"Okhla, Delhi","to":"Jaipur","pickup":"kal subah 6 baje",
       "truck":"32 ft container","weightTons":20,"target":35000,"ceiling":38000,"mode":"sim",
       "contacts":[{"id":"t1","name":"Test Owner","phone":"","city":"Okhla","truck":"32 ft container",
       "persona":{"available":true,"open":38000,"floor":36000,"concede":1000,
       "vehicle":"HR55 AK 7781","driver":"Test","driverPhone":"98110 22314"}}]}'
```

Poll `GET /api/loads/<id>` until `status` is `booked`. Simulated calls only advance when polled. Confirm `mode` is `sim` and no call has `live: true`.

Before pushing:

```bash
cd web && npm test && npx tsc --noEmit && npm run lint && npm run build
```

Also:

- **Next.js 16 differs from older versions.** See `web/AGENTS.md`, and read the guides in `node_modules/next/dist/docs/` before changing framework code.
- **Keep price logic out of the prompts.** It belongs in `negotiate.ts` and `board.ts`.
- **Keep unverified claims off the site.** "Nobody in India does this in Hindi" hasn't been verified, which is why it isn't there.

## Further reading

| Doc | Covers |
|---|---|
| [README.md](README.md) | Product, architecture, stack, API |
| [web/README.md](web/README.md) | What each file does |
| [agent/bhaada-agent.md](agent/bhaada-agent.md) | Setting up the Bolna agents |
| [tts/README.md](tts/README.md) | Running Chatterbox on Colab |
| [research.md](research.md) | Market research and why this idea |
