# Bhaada on Bolna: setup

Bhaada runs on two Bolna agents:

- **Intake**: the line a transporter calls. It takes the load in Hindi, reads it back,
  and calls `post_load`, which starts one caller agent per owner in the network.
- **Caller**: rings one truck owner, bargains with `submit_quote`, and closes with
  `report_outcome`. All the caller agents on a load share one board on our server:
  when one owner agrees to a rate, every other agent can only take a lower one, and
  `submit_quote` hands them that real rate (`rival`) to use as leverage.

The prompts and tool definitions live in `web/scripts/agents.mjs`.
`web/scripts/bolna-setup.mjs` creates or updates both agents from them.

```
transporter ──call──▶ intake agent ──post_load──▶ /api/bolna/intake
                                                     │ one call per owner
                       ┌─────────────┬───────────────┼───────────────┐
                    agent A       agent B   …     agent F   (Bolna queues past your concurrency)
                       │ submit_quote / report_outcome │
                       └──────────▶ shared board ◀─────┘
                                        │ cheapest agreed truck
                                        ▼
                         booked, others released, Telegram alert
```

## 1. Run the server where Bolna can reach it

Production runs on Render at `https://bolna-ai.onrender.com`, and both agents point
there (see `../HANDOFF.md`). Use that as `PUBLIC_URL` unless you are testing a local
change. Running the setup script with a tunnel URL repoints the live agents too.

For local work, the store is in memory, so run one process and expose it with a free tunnel:

```bash
cd web && npm run dev                           # http://localhost:3000
brew install cloudflared                        # once
cloudflared tunnel --url http://localhost:3000  # gives https://<random>.trycloudflare.com
```

## 2. Fill in `web/.env.local`

See `web/.env.local.example`. The minimum for real calls:

```
BOLNA_API_KEY=bn-...
BHAADA_TOOL_TOKEN=<any long random string>
PUBLIC_URL=https://<random>.trycloudflare.com
BHAADA_OWNER_PHONES=+91XXXXXXXXXX,+91YYYYYYYYYY   # verified numbers on the trial
```

## 3. Create the agents

```bash
cd web && node scripts/bolna-setup.mjs
```

It prints `BOLNA_AGENT_ID` and `BOLNA_INTAKE_AGENT_ID`. Add both to `.env.local`
and restart `npm run dev`. Run the script again whenever the tunnel URL changes;
with the ids set, it updates the agents instead of creating new ones.

## 4. Test it

- `/desk` → **Call Bhaada** talks to the intake agent in the browser (Bolna Web Call,
  no phone number needed). Say the load; once you confirm, six agents start.
- Owners with a number in `BHAADA_OWNER_PHONES` get real calls; the rest are
  simulated on the same board, so two verified phones still show all six agents.
- **Start N agents** on the form does the same without the intake call.

## Limits on the Bolna trial

- 2 concurrent outbound calls, verified numbers only. Bolna queues the rest and dials
  them as lines free up, so later calls start with a lower bar already set.
- A phone number for transporters to dial in on costs money (and Indian numbers need
  compliance). The browser web call covers the demo.
- Custom TTS (Chatterbox) works on single-language agents only, which is how the
  setup script builds them (Hindi).

## Voice: Chatterbox

See `tts/README.md`. Once the voice is registered in Bolna, set
`BHAADA_TTS_VOICE=<voice name>` and rerun the setup script. Without it the agents
use Sarvam's Bulbul Hindi voice, which Bolna hosts.
