# Research: Bolna Buildathon (Symphony 2026), v2

> Goal: find a **real, phone-heavy, B2B problem** in **logistics or real estate**, shaped like the voice companies YC is funding, that we can ship as an exceptional demo by **31 Oct 2026** using only free tiers.
> Researched: 29 Oct 2026. Replaces v1 (Ruko, the anti-scam line). v1 is still in git history at commit `2683dd4`.

---

## 0. TL;DR

**Recommendation: _Bhaada_** (भाड़ा, "freight charge"), an **AI carrier-sales desk for Indian transporters**.

A transport agent gets a load: *"Delhi to Jaipur tomorrow morning, 20 tons, 32-ft container."* Today they spend the next hour **phoning truck owners one by one** to ask who's free and haggle over the rate. Bhaada does those calls **in parallel, in Hindi**. It asks about availability, negotiates within the transporter's budget, confirms the vehicle and driver numbers, and books the best truck. Next morning it makes the **check call** to the driver ("gaadi kahan pahunchi?") and updates the shipper.

**Why this:**
- **It's the most-funded voice AI pattern at YC right now.** HappyRobot (YC S23) is valued at **$1.22B** doing this for US freight. **Lanesurf (YC S25)**, built by two IIT Delhi founders, calls carriers in parallel to book US loads. FleetWorks (YC 2023) works with 15 of the top 100 US brokers. **Nobody we could find does it for India**, in Hindi, over plain phone calls.
- **Indian trucking is even more phone-driven than the US.** There are ~15 lakh truck owners, most with 1–3 trucks. 75%+ of operators own fewer than 5 trucks, and they find loads through brokers and referrals.
- **It matches what wins voice hackathons.** The agent **calls out and gets something done**: Procuro, Dealwise and Claimsio all placed at ElevenLabs. A live demo where the agent phones two judges and negotiates with them is hard to forget.
- **It fits the Bolna free trial.** The trial allows **2 concurrent outbound calls to verified numbers**, which is exactly a two-truck-owner negotiation demo.

---

## 1. Why we moved off Ruko

| Reason | Evidence |
|---|---|
| **Already built on Bolna** | The Bolna builders wall already lists `rakshak-ai`, which *"screens scam calls aimed at elderly parents"*. Judges will have seen it. [Bolna builders wall](https://www.bolna.ai/builders/wall) |
| **Common hackathon idea** | "Scam Fighters" and "Check on Loved Ones" both showed up at the AssemblyAI SF voice hackathon, and neither placed. [AssemblyAI](https://www.assemblyai.com/blog/voice-agent-hackathon-sept-19) |
| **Weak YC shape** | B2C, a senior user who won't pay, and a risky trust ask ("call us before you pay"). The YC voice companies below are almost all **B2B, vertical, and replace a specific phone job**. |
| **Friends' and team feedback** | The team's own call. |

---

## 2. What YC is funding in voice (logistics and real estate)

| Company | Batch | What the voice agent does | Signal |
|---|---|---|---|
| **HappyRobot** | S23 | Check calls, load updates, appointment scheduling, payment inquiries, **rate negotiation** for freight | **$150M Series C at $1.22B** (Aug 2026). 150+ customers, and 8 of the top 10 US brokers reportedly use it. [Forkast](https://forkast.news/happyrobot-wants-1-2-billion-to-run-your-freight-by-voice/), [Under30CEO](https://www.under30ceo.com/ai-agents-happyrobot-series-c/) |
| **Lanesurf** | S25 | Finds nearby empty trucks, **calls them in parallel**, negotiates, books. Loads booked in ~10 min | IIT Delhi founders. Says brokers take 30–50 inbound carrier calls to cover one load. [YC](https://www.ycombinator.com/companies/lanesurf) |
| **FleetWorks** | 2023 (batch unclear) | Calls, texts and emails carriers to cover loads, make tracking calls and reschedule appointments | Reportedly 40+ brokerages, 15 of the top 100 (company-adjacent source). [YC](https://ycombinator.com/companies/fleetworks) |
| **Bernard** | S26 | AI employees for appliance servicers: phone, scheduling, **dispatch** | Dispatch for technicians, not freight. [YC supply chain list](https://www.ycombinator.com/companies/industry/supply-chain-and-logistics) |
| **Wayline** | S25 (per aggregator) | 24/7 voice and text for property managers: leasing, maintenance, receptionist | Claims 94% of calls automated (company-reported). [YC launch](https://www.ycombinator.com/launches/OGH-wayline-ai-voice-and-text-for-property-managers) |
| **Central Coms / AveryIQ (W24) / Haven** | various | Property-management agents for leasing and maintenance coordination | Many companies in a crowded US niche. [YC proptech](https://ycombinator.com/companies/industry/proptech) |
| **Superunit / Atlog (P25) / Freya** | various | Voice agents for employment verification, compliant outbound, financial services | Horizontal pattern: **one painful call type per vertical** |
| **Bolna** (our host) | YC-backed | Indic voice-agent platform | Its listed customers are Awign, Futwork, GoKwik, Hypothesis and Hyreo, covering hiring, onboarding and e-com. **None in freight.** [casestudies.com](https://www.casestudies.com/company/bolna) |

**Pattern:** YC funds **vertical B2B agents that replace one phone-heavy job** (carrier sales rep, dispatcher, leasing agent). The agent is measured in **loads booked and calls handled**, not minutes talked. The **freight versions raise the most money**, because every call is tied to revenue (a load booked or lost) and brokers already think in cost per load.

**The gap:** every freight company above is **US-only and English-only**. India's market works the same way (brokers phoning small fleet owners), but in Hindi, over voice calls and WhatsApp, often with feature phones.

---

## 3. What wins voice-agent hackathons

**ElevenLabs Worldwide Hackathon** (Feb 2025, 10+ cities). [Winners](https://elevenlabs.io/blog/announcing-the-winners-of-the-elevenlabs-worldwide-hackathon)
- **GibberLink** (global #1): two agents on a call recognise each other and switch to a machine protocol. **A viral, live, phone-to-phone demo.**
- **Procuro** (NY #2): **calls suppliers** to find delayed supply-chain parts.
- **Dealwise** (SF #1): **calls local businesses** for quotes and availability.
- **Claimsio** (Warsaw #2): compliant automated debt collection.
- **DeepSky** (Warsaw #1): voice agent for airspace safety.
- **Roadmate** (SF #2): copilot that talks to drowsy drivers and texts a friend.
- Bangalore winners were all creative or media tools (film, podcast ads), with **nothing in Indian logistics**.

**AssemblyAI SF Voice Agent Hackathon** (Sep 2025). [Recap](https://www.assemblyai.com/blog/voice-agent-hackathon-sept-19)
- Best Overall went to **Voxy** (zero-config voice agent for any business: *"The platform just works"*). Technical prize went to **Podweaver** (250 ms timing precision).
- Scam-fighting and elder check-in projects **didn't place**.

**What judges reward:**
1. **The agent acts in the world by calling out**: books, negotiates, procures. It doesn't just answer questions.
2. **A live demo on real phones** beats slides.
3. **A clear economic job** (procurement, collections, dispatch) over "nice to have".
4. **It visibly works**, end to end.

Bhaada hits all four: it calls out, it negotiates live on judges' phones, every call is tied to a booked load, and the whole loop runs from request to booked truck to check call.

---

## 4. Call centres: where the phone work actually is

- Indian BPO attrition has historically been **30–40%**, and up to 55–65% in some years. NASSCOM (as cited) puts the replacement cost at ~1.5× annual salary. **⚠️ This data is old (2003–2011). We found no reliable 2025–26 number.** [DestinationCRM](https://www.destinationcrm.com/Articles/CRM-News/CRM-Featured-Articles/Attrition-and-Training-Stalling-Indian-Call-Centers--47234.aspx), [Governance Now](https://www.governancenow.com/gov-next/egov/talent-crunchattrition-may-put-india-behind-other-bpo-nations)
- **US freight already offshores this exact job.** Listings for *"U.S. Truck Dispatcher & Carrier Sales Representative"* are staffed out of South Asia. [Upwork](https://www.upwork.com/freelance-jobs/apply/Truck-Dispatcher-Carrier-Sales-Representative-Site-Rawalpindi_~022101822805753191811/) The carrier-sales desk is a call-centre job, and it's the one HappyRobot and Lanesurf automate.
- **US benchmarks:** it takes ~**7 calls at ~2 min each** to find one qualified carrier ([DAT](https://www.dat.com/blog/find-carriers-with-fewer-phone-calls)), and brokers take **30–50 inbound carrier calls per load** ([Lanesurf](https://www.ycombinator.com/companies/lanesurf)). One vendor says check calls take **30%+ of a dispatcher's day** (vendor claim). [Numeo](https://numeo.ai/blog/what-is-automated-broker-calling-how-ai-handles-carrier-broker-communication)
- **India-side call-centre voice AI** (SquadStack, Ringg, Gnani, Caller.digital) targets **BFSI, edtech, healthcare and real-estate sales**. We found **no one focused on freight**. [Caller.digital list](https://caller.digital/blog/top-voice-ai-solutions-india-2026)

**Insight:** the most valuable call-centre work to automate isn't generic support. It's an **operations call that closes a transaction**, like booking a truck. In India, transporters' own staff do this work unbundled, with no software at all.

---

## 5. Domains we evaluated

| Idea | Pain | Competition | Verdict |
|---|---|---|---|
| **Real estate: lead qualification and site-visit booking (India)** | Real: leads go cold within minutes | **Saturated**: Caller.digital, Zappio, Edesy (₹75K + ₹5K/mo), Haptik, Bolna itself. [Caller.digital](https://caller.digital/blog/ai-calling-real-estate-lead-qualification-india), [Zappio](https://www.producthunt.com/products/zappio), [Edesy](https://edesy.in/blog/ai-calling-real-estate-lead-follow-up-india-2026) | ❌ Judges will see many of these |
| **Real estate: property management (leasing, maintenance)** | Big in the US | Wayline, Central Coms, AveryIQ, Haven (all YC), LetHub, Zuma. Indian rentals are fragmented across individual landlords, so there's no clear buyer | ❌ Crowded in the US, no buyer in India |
| **E-com logistics: COD confirmation and NDR calls** | Very real. RTO is 30–40% for COD, at ₹180–470 per RTO (vendor figures). [Base](https://www.base.com/en-IN/blog/india-ecommerce-benchmarks-2026-how-brands-reduce-rto-in-india-and-hit-accuracy-sla-targets), [Shipmozo](https://www.shipmozo.com/blog/ndr-management) | **GoKwik is already Bolna's customer**. ClickPost, Shiprocket and Shipway bundle NDR calling, some for free | ❌ Solved, commoditised |
| **Last-mile: pre-delivery landmark/address call** | Real | Overlaps with NDR tools, and the value per call is low | ❌ A feature, not a company |
| **Freight: transporter ↔ truck-owner load booking and check calls (India)** | Phone-and-WhatsApp-run market of ~15 lakh owners | **No Indian voice player found.** Vahak, BlackBuck and TruckSuvidha are apps and load boards that need the owner to use a smartphone | ✅ **Pick** |

---

## 6. The problem, with numbers

### Market shape
- **~15 lakh truck owners** in India. *"Most of them have small fleets of 1 to 3 trucks."* They *"relied heavily on lakhs of transporters/brokers to help them find relevant loads"*, and *"each broker has very limited visibility on the available demand."* New brokers are met *"only through referrals."* [BlackBuck engineering blog, "Bhai load hai kya?"](https://eng.blackbuck.com/bhai-load-hai-kya/)
- **75%+ of road transport** is small owner-operators with **fewer than 5 trucks** (NITI Aayog 2022). [Deccan Herald](https://deccanherald.com/business/indian-truckers-caught-on-a-pot-holed-road-to-growth-aspirations-1218737.html), [Deloitte](https://www2.deloitte.com/in/en/pages/consumer-business/articles/road-logistics-india/press-release.html)
- Road freight is **~$154B (2025)**, growing ~8.6%/yr. Road carries **66–71% of India's freight**. [Mordor](https://www.mordorintelligence.com/industry-reports/india-road-freight-transport-market/market-size), [Nexdigm](https://www.nexdigm.com/market-research/insights/blog/road-freight-market-opportunity-analysis/)
- The truck fleet is expected to **more than quadruple from 4 million (2022)** by 2050 (NITI). [Outlook Business](https://www.outlookbusiness.com/news/india-s-truck-market-likely-to-grow-over-4-times-by-2050-niti-report-news-222300)
- Trucks average **~33% utilisation**: idle, empty or part-loaded much of the time. ⚠️ This is an old IFC figure (2010). [IFC](https://www.ifc.org/en/stories/2010/new-technology-puts-truckers-back-in-the-driver-seat-in-india)
- Brokerage is estimated at **$3–6B a year** across Indian logistics. ⚠️ This is a founder's estimate. [Maritime Gateway](https://maritimegateway.com/?p=38584)
- Owners' margins are thin: *"More than 90% of what they earn per trip goes into"* EMIs, fuel, tolls and driver pay. Every idle day hurts. [BlackBuck](https://eng.blackbuck.com/bhai-load-hai-kya/)

### Why voice, and not another app
- *"A major portion of the transportation business is done through telephone calls, which results in a lot of confusion, delays, and losses."* (Indian logistics founder, 2021) [YourStory](https://yourstory.com/2021/08/logistics-startup-b2b-transportation-marketplace/amp)
- In a study of **490 Indian truck drivers**, **55% used their phone while driving, "mainly for talking"**. Voice is how this industry works. [IATSS Research 2022](https://doaj.org/article/6b5a99459ed6429a8c96ecf8c9f4f64d)
- Among Indian drivers surveyed (2017, all driver types), **~45% used feature phones**. [Statista / SaveLIFE](https://www.statista.com/statistics/704950/type-of-mobile-users-among-drivers-india/)
- Tata Motors' trucker campaign had to use **voice messages in 12 regional languages** to reach low-literacy drivers. [Spikes Asia](https://lovethework.com/work-awards/campaigns/photo-ok-please-1467475)
- Load matching still runs on **WhatsApp groups and phone calls**. [Coimbatore transport groups](https://grouplink.com.in/join-the-top-coimbatore-transport-whatsapp-group-links-today/), [Trukky](https://www.trukky.com/blog/why-broker-based-truck-booking-is-risky-for-indian-businesses/)

**The existing digital fixes (Vahak, BlackBuck, TruckSuvidha) ask a 1–3-truck owner to install and use an app.** Bhaada asks nothing of the truck owner. It just **calls them, the way their broker already does**.

### ⚠️ Honest gap
We found **no first-person quotes from Indian transporters** online. Reddit is blocked for our tools, and trade press is thin. This makes **§9 (phone 5 transporters before Oct 31)** the top validation priority. It's also easy to do, since transport agents list public numbers on IndiaMART and Justdial.

---

## 6.5 How a truck load moves in India today

**The people involved**
```
 SHIPPER  ──▶  TRANSPORTER / BROKER  ──▶  TRUCK OWNER  ──▶  DRIVER
 (factory,      (transport agent, often     (1–3 trucks,      (drives the
  trader)        owns few or no trucks)      ~15 lakh of them)  truck)
                         ▲
                 COMMISSION AGENTS (local middlemen with their own phonebooks)
```

**The life of one load** (☎️ = mostly phone calls)
```
1. ORDER ☎️        Shipper calls transporter: "32-ft, Delhi→Jaipur, kal subah, 20 ton."
                   Transporter quotes a price from gut feel and recent deals.
2. FIND A TRUCK ☎️☎️☎️   ◀── THE BOTTLENECK
                   Phonebook + WhatsApp groups: "Bhai, Delhi–Jaipur, 32 ft, kal subah, gaadi hai?"
                   (Brother, Delhi to Jaipur, 32-ft, tomorrow morning, got a truck?)
                   One by one: not free / wrong size / call later / too costly. Often an hour or more per load.
3. NEGOTIATE ☎️    Owner says ₹40k, transporter says ₹35k. Margin = shipper price − owner price.
4. CONFIRM         Vehicle number, driver number and registration papers arrive on WhatsApp.
5. LOADING         Lorry receipt (LR/bilty) + e-way bill are made. The owner usually gets an advance.
6. IN TRANSIT ☎️☎️  Shipper: "gaadi kahan hai?" (where's my truck?) The transporter calls the driver, who answers while driving.
7. DELIVERY        The receiver signs the LR as proof of delivery (POD). A photo goes on WhatsApp.
                   The balance payment waits for the POD, often for weeks.
8. EMPTY TRUCK ☎️  Truck is empty in Jaipur. The owner calls brokers for a return load.
                   Every idle day hurts: >90% of trip earnings go to EMIs, fuel and tolls.
```
Steps 2–3 (find + negotiate) are what HappyRobot and Lanesurf automate in the US. Step 6 is the "check call".
⚠️ This is assembled from the BlackBuck blog, Indian freight-platform write-ups and general industry practice. Details such as the advance % and how long balance payments take vary, so **confirm them in the §9 transporter calls.**

## 6.6 Bhaada's flow

```
 TRANSPORTER                 BHAADA                              TRUCK OWNERS
 "Delhi–Jaipur, 32 ft,  ──▶  ① INTAKE: turns it into a structured load
  kal 6 baje, 20 ton,           (route, date, truck type, target ₹35k, ceiling ₹38k)
  max ₹38,000"               ② SHORTLIST: the transporter's OWN contacts who run this route with this truck type
                             ③ PARALLEL CALLS in Hindi, in the transporter's name ──▶ Owner A ☎️  Owner B ☎️
                             ④ NEGOTIATE: open at target, step up, ceiling enforced IN CODE
                                 every call ends in a named outcome:
                                 BOOKED · TOO_EXPENSIVE · NOT_FREE · CALL_LATER · WRONG_PERSON · VOICEMAIL
                             ⑤ PICK & BOOK: cheapest acceptable offer. Read back the vehicle number digit by
                                 digit, plus rate and pickup time. Above the auto-approve limit, the transporter gives a one-tap yes
 📱 "BOOKED RJ14-GB-4521 ◀── ⑥ CONFIRM: dashboard + Telegram   ──▶ A: confirmation  B: "agli baar" (next time)
  ₹36,500 · saved ₹1,500"    ⑦ CHECK CALLS to the driver (pickup + en route): "Gaadi load hui? Kahan pahunchi?" (Loaded yet? Where are you now?)
                             ⑧ RETURN LOAD (v2): owner calls in "Jaipur mein khali hoon" (I'm empty in Jaipur) → matched to open loads
```

**Inside a call, the agent never decides price alone.** It asks our backend:
```
Bolna agent ── "owner quoted ₹40k" ─────────▶ backend: ceiling ₹38k → "counter ₹36k"
            ── "owner: ₹36.5k final" ───────▶ backend: within ceiling → "book it"
            ── "vehicle RJ14GB4521" ────────▶ backend: save, update dashboard, Telegram
```

| Step | Oct 31 scope |
|---|---|
| ① Intake (form; voice if time allows) | MVP |
| ② Shortlist (filter over contacts) | MVP |
| ③④ Parallel calls + negotiation | **MVP core** |
| ⑤ Book + read-back | MVP |
| ⑥ Telegram + live dashboard | MVP |
| ⑦ Check call | One recorded call for the pitch video |
| ⑧ Return-load line | Pitch slide only |

---

## 7. Product: **Bhaada**

### Who pays
**The transport agent, broker or small 3PL** (lakhs of them). They already pay staff to phone trucks all day, and they think in margin per load. Later, digital freight platforms (Vahak, BlackBuck, Fr8) could use Bhaada as an API to reach owners who don't use their apps.

### Core flow (MVP, must ship)
1. **Post a load by voice or form.** The transporter calls or opens the dashboard: *"Kal subah 6 baje, Delhi (Okhla) se Jaipur, 20 ton steel coil, 32 ft container, budget ₹38,000 tak."* ("Tomorrow 6 a.m., Okhla in Delhi to Jaipur, 20 tons of steel coil, 32-ft container, budget up to ₹38,000.") Bhaada structures it into lane, date, weight, vehicle type, target rate and ceiling.
2. **Parallel outbound calls** to the transporter's **own** truck-owner contacts, the people they already work with. In Hindi or Hinglish, Bhaada:
   - introduces itself *on behalf of the transporter* ("Sharma Roadlines se bol rahi hoon": "calling from Sharma Roadlines"),
   - checks availability, vehicle type and location,
   - asks for their rate, then **negotiates**: it anchors at the target, moves in steps, and never crosses the ceiling,
   - captures the **vehicle number and driver mobile**, reading them back digit by digit.
3. **Pick and book the best offer.** The winner gets a booking confirmation (SMS, WhatsApp or Telegram). The others get a polite *"agli baar"* ("next time"). If an offer is above the auto-approve limit, Bhaada pings the transporter for a one-tap yes.
4. **Check call** at pickup time and en route, made to the driver: *"Gaadi load ho gayi? Kahan pahunchi?"* ("Is the truck loaded? Where has it reached?") Status goes to the dashboard and the shipper.
5. **Dashboard:** live call cards (ringing, talking, quoted ₹X, booked), the transcript summary and the final rate vs budget.

### "Wow" features (if time allows)
- **Inbound return loads:** a truck owner calls Bhaada's number, *"Jaipur mein khali hoon, Delhi wapas jaana hai"* ("I'm empty in Jaipur and need to get back to Delhi"), and Bhaada matches them against open loads. This is the two-sided v2.
- **Owner memory:** it remembers each owner's lanes, usual rates and reliability, so the next calls are shorter and quotes improve.
- **Rate intelligence:** every negotiated quote becomes lane-rate data, something Indian freight barely has today.

### Live demo script (about 3 minutes)
1. Presenter speaks the load to Bhaada (browser call) on stage.
2. **Two judges' phones ring at once** (verified numbers on the Bolna trial). Each judge plays a truck owner. One quotes high, one quotes medium.
3. Bhaada negotiates live in Hindi, books the cheaper truck, reads back the vehicle number and thanks the other judge.
4. The dashboard flips to **BOOKED, ₹36,500, saved ₹1,500 vs budget, 2 min 40 s**. The confirmation message arrives on the presenter's phone.
5. Cut to a pre-recorded **check call** with a "driver".
6. The line: **"HappyRobot is worth $1.2 billion doing this in English for the US. India has 15 lakh truck owners, and they all answer the phone in Hindi."**

### Metrics we'll show
Time to book a load, calls per booking, final rate vs ceiling, and the % of calls that completed with structured data (vehicle no., rate, ETA).

### Risks and how we handle them
| Risk | Mitigation |
|---|---|
| A relationship-based market distrusts "a robot" | Bhaada calls **the transporter's own contacts in the transporter's name**, so it isn't a cold marketplace. The human can take over any call (warm transfer) |
| Negotiation errors | Hard floor and ceiling in code, not just in the prompt. Bookings above the threshold need a human tap. Every booking is confirmed in writing |
| Noisy highway audio, Hindi digits | Indic STT (Sarvam or Deepgram), digit-by-digit read-back, SMS confirmation of the vehicle number |
| Regional languages (Punjabi, Tamil, Telugu drivers) | MVP is Hindi plus Hinglish. Language choice per contact is on the roadmap |
| Calling rules (TRAI) | These are transactional calls to existing business contacts, not telemarketing. ⚠️ Verify before any real launch |

---

## 8. Free tech stack

| Layer | Option | Notes (⚠️ verify on signup) |
|---|---|---|
| Voice agents | **Bolna** | **Trial: up to 2 concurrent calls, verified numbers only**, which is exactly our demo. Outbound call API plus **batch calling** (CSV, schedule ≥2 min ahead). Custom function calls and webhooks to our backend. [Concurrency](https://bolna.ai/docs/outbound-calling-concurrency), [Batch](https://www.bolna.ai/docs/batch-calling) |
| Hindi STT/TTS | Sarvam (₹100 free) / Deepgram ($200 credits) | Pick whichever handles digits and noise better in testing |
| LLM | Groq or Gemini free tier | Extracts the structured load, decides the next negotiation step |
| Backend + dashboard | Next.js on Vercel (hobby), reusing `web/` | Load state, negotiation rules, live call cards (polling or SSE) |
| Confirmations | Telegram bot (free) | WhatsApp later |
| Data | Supabase free tier, or JSON for the demo | Loads, owners, quotes |

**Ask in Bolna Slack on day one:** can buildathon entrants get credits or a higher concurrency limit?

---

## 9. Validation plan (before Oct 31, this is what makes the pitch credible)

1. **Call 5–8 transport agents** listed on IndiaMART or Justdial (search "transport contractor Delhi" or "truck booking agent"). Two minutes each:
   - "Ek load ke liye truck dhoondhne mein kitne phone karne padte hain? Kitna time?" (How many calls and how much time does it take to find a truck for one load?)
   - "Rate pe kitni baar baat hoti hai?" (How many rounds of rate negotiation?)
   - "Kya aapke paas staff hai jo sirf phone karta hai? Kitni salary?" (Do you have staff who only make calls? What's their salary?)
   - "Agar ek system aapki taraf se truck walon ko call kare aur best rate pe book kare, aap use karenge? Kitna denge per load?" (If a system called truck owners for you and booked the best rate, would you use it? How much would you pay per load?)
2. **Call 3 truck owners.** Would they mind an AI calling with a load? Would they call a number for return loads?
3. **Record quotes with consent** for the pitch video. Even 3 real voices beat any statistic.
4. **Track:** calls per load, hours per day on the phone, staff cost, and willingness to pay per load.

### Interview notes
_(fill in)_

---

## 10. Open questions
- [ ] Bolna trial minutes: enough for testing plus the demo? Can we get buildathon credits?
- [ ] Can a Bolna agent hold negotiation state across turns through function calls, or do we manage the state on our backend?
- [ ] Which Hindi TTS voice sounds most like a real transport-office caller?
- [ ] Reuse the `web/` landing (built for Ruko) or rebrand it for Bhaada? The 3D phone visual still fits.
- [ ] Team split: agent prompt + negotiation logic / backend + Bolna webhooks / dashboard / transporter calls + pitch video.

---

### Sources not linked above
[ElevenLabs Berlin showcase](https://berlin.aitinkerers.org/hackathons/h_AUrIIiOrRa8/showcase) · [YC housing & real estate](https://www.ycombinator.com/companies/industry/housing-and-real-estate) · [HappyRobot (Sacra)](https://sacra.com/c/happyrobot/) · [Vahak](https://www.vahak.in/how-vahak-helps) · [Redseer](https://redseer.com/?p=89785) · [Bolna limits](https://www.bolna.ai/docs/api-reference/limits)
