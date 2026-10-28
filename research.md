# Research: Bolna Buildathon (Symphony 2026)

> Goal: find a **real, painful, voice-native problem** where we can ship something exceptional in ~3 days, using only free tiers.
> Researched: 28–29 Oct 2026. Submission deadline: **31 Oct 2026**.

---

## 0. TL;DR

**Problem we recommend:** Indian seniors are being drained by phone/video-call scams ("digital arrest", fake courier/TRAI/bank calls). The scam works by **isolating** the victim: "don't hang up, don't tell anyone". Almost every rescue story we found has the same shape: **a second trusted voice interrupted** (a spouse, a bank manager, a grandson), and the spell broke.

**What doesn't exist:** a "second voice" that is
- reachable by a **plain phone call** (works on a feature phone, no app),
- **in the senior's language**,
- **available at 2 AM, in the moment**, and
- able to **pull the family in** and run the **golden-hour reporting** steps if money already moved.

Existing tools are app-based, smartphone-only, number-reputation based, or flagship-phone-only (details in §4).

**Working name:** **Ruko** (from the government's own anti-scam mantra *"Ruko, Socho, Action Lo"*: Stop, Think, Act).
*"Before you pay anyone who called you, call Ruko."*

---

## 1. How we researched (and its limits)

| Source type | Used? | Notes |
|---|---|---|
| News, court and government data (I4C, MHA, Supreme Court, High Courts) | ✅ | Primary evidence for scale |
| Forums with first-person stories (Hacker News, TechEnclave India) | ✅ | Real user voices, quoted below |
| Surveys and academic work (inoculation research, elderly tech-use surveys) | ✅ | Behaviour and design evidence |
| Competitor launches (Google, Truecaller, Indian startups) | ✅ | Gap analysis |
| **Reddit** | ❌ **blocked** | Reddit is blocked for our search tools, fetch tools and browser automation. **Action item:** a human should spend 30 min on r/india, r/IndiaInvestments, r/bangalore, r/mumbai, r/indianparents searching `digital arrest`, `parents scammed`, `FedEx call`, `1930 helpline` and paste the best threads into §9 |
| Vendor blogs (AI receptionist companies etc.) | ⚠️ | Used only to map competition. Their stats are marketing, not evidence |

We did not stop at the first idea. Six problem spaces were evaluated (§6) before picking one.

---

## 2. The problem, with numbers

### Scale
- **₹22,495 crore** lost to cyber fraud in India in 2025, from **24+ lakh complaints**. [FPJ](https://www.freepressjournal.in/amp/mumbai/over-24-lakh-cyber-complaints-22495-crore-fraud-reported-in-2025)
- "Digital arrest" alone: **1,23,672 complaints and ₹1,935 crore lost in 2024** (govt data). [Inc42](https://inc42.com/?p=504907)
  Roughly **₹4,000 crore over 2022 to mid-2026**. [NewsBytes](https://www.newsbytesapp.com/news/science/india-s-digital-arrest-scam-causes-4-000cr-losses-in-3-years/story)
- The **Supreme Court** said victims, *"mostly elderly"*, lost **over ₹3,000 crore**, and ordered a pan-India CBI probe (Dec 2025). [The Hindu via SuperKalam](https://superkalam.com/current-affairs/04-11-2025/digital-arrests-are-a-very-big-challenge-victims-mostly-elderly-lost-3-000-cr-in-india-alone-sc-pg14-e9a40d2b-a355-49c7-ae2f-a819ae7fb574), [SuperKalam Dec 2025](https://superkalam.com/current-affairs/17-12-2025/sc-expresses-shock-over-money-lost-to-digital-arrest-fraud-pg10-e9c57275-2db0-40a4-8c01-da01819bf68f)
- **Pune alone:** senior citizens lost **₹100+ crore in 136 digital-arrest cases in 19 months**. [Punekar News](https://www.punekarnews.in/?p=245348)
- **4,168 crore spam calls** hit Indians in 2025. **770 crore were fraud calls.** **66%** of unknown calls were spam. [Deccan Herald](https://deccanherald.com/technology/truecaller-report-india-hit-by-4168-crore-spam-calls-in-2025-3896311), [WION](https://wionews.com/trending/41-68-billion-spam-calls-in-india-66-per-cent-of-unknown-numbers-on-truecaller-were-spam-whatever-happened-to-do-not-disturb-1778144364126)
- The problem is spreading to **Tier-2 and Tier-3 cities**. [Bhaskar Digital](https://bhaskardigital.com/how-truecaller-saved-a-kanpur-pensioner-from-a-%e2%82%b990-lakh-digital-arrest/)
- Individual losses are life-ending: **₹14.85 crore** (Delhi doctor couple), **₹31.8 crore** over 6 months (Bengaluru woman), **₹1.57 crore** after **25 days** of "digital arrest" (Mumbai). [Brut](https://www.brut.media/in/articles/digital-arrest-scam-delhi-nri-doctor-couple-loses-rs-14-85-crore), [Gulf News](https://gulfnews.com/world/asia/india/bengaluru-woman-loses-rs318-million-in-6-month-digital-arrest-cyber-fraud-1.500349135), [LatestLY](https://www.latestly.com/india/mumbai-shocker-retired-senior-officer-digitally-arrested-for-25-days-duped-of-inr-1-57-crore-by-fraudsters-posing-as-police-and-judges-in-andheri-7373725.html)

### How the scam works (why voice is the battlefield)
1. It starts as a **phone call**, often an IVR: "your FedEx parcel has drugs", "TRAI will block your SIM in 2 hours", "your Aadhaar is linked to money laundering". [Quick Heal](https://www.quickheal.co.in/knowledge-centre/digital-arrest-scams-2-0-new-tactics-fraudsters-are-using-in-2026/), [Gujarat Cyber Crime](https://gujaratcybercrime.org/Digital_Arrest_Awareness_Watermarked.pdf)
2. The call is "transferred" to a fake CBI, police or customs officer. It then moves to a **WhatsApp or Skype video call** with uniforms and fake courtrooms.
3. **Isolation is the core tactic.** Victims are told *not to disconnect and not to speak to family*. [AU Bank](https://www.au.bank.in/blogs/video-call-digital-arrest-scams-india), [ATB Legal](https://atblegal.com/?p=11019)
4. Money is demanded as a "security deposit" or "verification" payment. FDs get broken, and loans get taken.
5. **Legal fact:** "digital arrest" **does not exist** in Indian law. [Mumbai Police drive](https://www.outlookmoney.com/news/no-such-concept-as-digital-arrest-exists-under-the-law-mumbai-police-launches-awareness-drive-for-senior-citizens)

### The system after the scam is overloaded
- The **1930 national cyber helpline** is struggling. The **Bombay High Court** summoned officials over it not working in a senior citizen's digital-arrest case. [LiveLaw](https://www.livelaw.in/amp/high-court/bombay-high-court/apologize-to-public-if-national-cybercrime-helpline-doesnt-work-bombay-high-court-summons-officials-in-case-over-digital-arrest-of-senior-citizen-285777)
  The **Delhi HC** sought the Centre's stand on helpline efficiency. [LawGratis](https://www.lawgratis.com/blog-detail/delhi-hc-seeks-centres-stand-on-cybercrime-helpline-efficiency)
  The **Home Minister** ordered a revamp (June 2026). [Devdiscourse](https://www.devdiscourse.com/article/headlines/3936185-hm-shah-reviews-functioning-of-national-cybercrime-helpline-asks-to-revamp-system-to-improve-efficiency)
- Karnataka's 1930 call volume went from **1.3 lakh (2022) to 24 lakh (2025)**. Police say delays let money exit mule accounts. [GoodReturns](https://www.goodreturns.in/news/karnataka-cybercrime-helpline-1930-sees-spike-in-calls-from-1-3-lakh-in-2022-to-24-lakh-in-2025-1483819.html)
- **Speed matters:** reporting within ~24h greatly improves the chance of recovery. [The420](https://the420.in/victim-of-cyber-fraud-prepare-these-information-before-dialing-cyber-crime-helpline-1930/), [UP "golden hour"](https://the420.in/uttar-pradesh-cyber-fraud-recovery-1930-cfmc-golden-hour/)
  The rapid-response system **saved ₹8,000+ crore in 2025**. [Dynamite News](https://www.dynamitenews.com/crime/cyber-frauds-mount-to-rs22495-crore-in-2025-over-rs8000-crore-saved-through-rapid-response-system)
  ⚠️ Secondary source: cumulatively, ₹10,718 cr was frozen but only ₹323 cr refunded. [Outlook Money](https://www.outlookmoney.com/retirement/cyber-fraud-rs-11158-crore-saved-across-328-million-complaints-how-to-report-financial-fraud-on-cybercrime-portal)

---

## 3. Real user voices

> *"Scariest half an hour of my life."* That user's TRAI "SIM block" IVR scam ended **when their spouse flagged it as fraud**.
> TechEnclave user `nitin_g3`. [thread](https://techenclave.com/t/share-your-online-fraud-experience/271718)

> On their uncle, told he'd won a ₹25L lottery: *"He wouldn't listen so I showed the number."* The number was from Pakistan.
> TechEnclave user `kartikoli`

> On the Truecaller-and-blocking approach: blocking numbers *"doesnt do a thing these days"*.
> TechEnclave user `Tracer_Bullet`

> From the HN post *"My mother was scammed out of all her savings"* (137 points, 67 comments). The poster built a national money-tracking system for their government:
> *"My system can track the money, but it is almost impossible to get it back."* At the police station, there were *"more than 20 cases in a single day"*.
> Later in the thread: *"Almost every friend I know has at least one relative who has been a victim."* [HN](https://news.ycombinator.com/item?id=46353704)

> From an Indian commenter in the same thread: *"there's hardly anything that you can do … you can only focus on yourself and those you know and try to educate them."*

> A suggestion from the same thread: *"Two phone numbers being required … yours and trusted person … if they ever called me for the 2nd code, I could ask questions about why they need it."*
> That is literally the "second voice" idea, wished for by a user.

**The rescue pattern, repeated across India:** a bank manager notices panic and **asks "what's going on?"**, and the scam collapses.
- 85-year-old in Indore: ₹1 cr saved after a 36-hour video call. [FPJ](https://www.freepressjournal.in/amp/indore/bank-manager-saves-85-year-old-woman-from-losing-over-1-crore-in-36-hour-video-call-scam-by-fraudsters-posing-as-police-officials-in-indore)
- 80-year-old in Navi Mumbai: ₹12 L saved, but **₹21.94 L already gone**. [FPJ](https://www.freepressjournal.in/amp/mumbai/navi-mumbai-alert-bank-manager-saves-80-year-old-man-from-losing-12-lakh-in-digital-arrest-scam)
- Kochi: "never seen so panicked". [Onmanorama](https://www.onmanorama.com/news/kerala/2025/12/18/never-seen-so-panicked-kochi-bank-manager-saved-elderly-customer-losing-4-5-lakh-digital-arrest-scam.amp.html)
- Ahmedabad: ₹2.21 cr saved for three seniors. [Organiser](https://organiser.org/2025/12/23/331559/bharat/gujarat-rs-2-21-crore-digital-arrest-scam-foiled-in-ahmedabad-bank-officials-rescue-three-elderly-citizens/amp/)
- HDFC Rohini: ₹1.12 cr. [FintechBizNews](https://www.fintechbiznews.com/lenders-banks/hdfc-bank-saves-rs-1-cr-of-senior-citizen)

**Insight:** what saves people isn't a blocklist. It's an **interruption by a calm, trusted voice who asks the right questions**. But that only happens by luck, at a bank counter, after hours of manipulation. **We can make that interruption available on demand, by voice, in any language.**

---

## 4. Why existing solutions don't cover this

| Solution | What it does | Gap |
|---|---|---|
| **Google Scam Detection** (Gemini Nano) | On-device detection of scam calls | **Pixel 9+ only**, **off by default**, unknown numbers only. Hindi support reported inconsistently. [TechCrunch](https://techcrunch.com/2025/11/20/google-steps-up-ai-scam-protection-in-india-but-gaps-remain), [Storyboard18](https://www.storyboard18.com/digital/google-rolls-out-on-device-scam-detection-in-india-as-digital-fraud-losses-top-%e2%82%b970-billion-84553.htm) |
| **Truecaller Family Protection** (Mar 2026) | Family admin can see alerts and remotely hang up | Needs the app on a smartphone. **Active features are Android-only.** Tied to **Premium**. Max 5 people. Number-reputation based, so a fresh number or a WhatsApp video call slips through. [TechRepublic](https://www.techrepublic.com/article/news-truecaller-family-protection-phone-scams/), [TechCrunch](https://techcrunch.com/2026/03/12/truecallers-now-lets-you-hang-up-on-scammers-on-behalf-of-your-family/) |
| **Bachao.AI, VRIKAAN** (Indian startups) | On-device app, family dashboard, UPI guard | **App install on a smartphone**, paid (VRIKAAN ₹149/mo). Claims are unverified. [YourStory](https://yourstory.com/companies/bachaoai), [Product Hunt](https://www.producthunt.com/p/vrikaan) |
| **Awareness campaigns** (PM's *Ruko Socho Action Lo*, police brochures) | Education | Static warnings **don't work well** (see §5). The victim is still alone in the moment |
| **1930 helpline** | Reporting after the loss | Overloaded and post-facto. Courts are intervening |

**The common blind spot:** these all assume a **smartphone + app + tech literacy**, and they act on **the number**, not **the story**. Digital-arrest scammers use fresh numbers and move to WhatsApp video, so number reputation fails.

### Who we're designing for
- **71%** of senior citizens find **basic feature phones** easy to use. Only **41%** use smartphones. **66%** find technology confusing. **44% feel embarrassed to ask again.** [Communications Today](https://www.communicationstoday.co.in/?p=357574)
- Older rural adults mostly own a **feature phone** and *share* a smartphone. [Sage, 2025](https://journals.sagepub.com/doi/10.1177/20501579251378548)
- ~**15 million** elderly Indians live **entirely alone**, three-quarters of them women (Census 2011). [Odisha Plus](https://odisha.plus/2026/02/elderly-isolation-india-ageing-alone-crisis/)
- Loneliness makes them *"easy targets of criminals and others who want to take advantage of their loneliness"*.

**So the interface has to be a phone call, in their language.** It can't be an app. This is a problem where **voice is the only interface that works**, which is what the buildathon is asking for.

---

## 5. Evidence that the intervention works

1. **A second voice breaks the spell.** Every rescue story above (spouse, bank manager, relative showing the number) shares this mechanism.
2. **Interactive practice beats warnings.** A study of **4,000+ US adults** (Journal of Consumer Policy, 2023) found that **only interactive exposure to simulated scams** improved detection. **Static warning material did not work.** It didn't reduce trust in legitimate messages either. [IDEAS/RePEc](https://ideas.repec.org/a/kap/jcopol/v46y2023i1d10.1007_s10603-022-09531-6.html), [Boston College CRR](https://crr.bc.edu/people-can-spot-a-scam-after-seeing-fakes)
   This is why a talk-to-it voice agent beats another awareness poster.
3. **Speed after the fact recovers money.** Golden-hour reporting saved ₹8,000+ cr in 2025 (§2). Victims don't know the steps, and they're panicking.

---

## 6. Other problem spaces we evaluated (and why we didn't pick them)

| Problem space | Evidence of pain | Why not (for *this* buildathon) |
|---|---|---|
| **AI receptionist for clinics/SMBs** (missed calls) | Real, but most stats are vendor claims | **Saturated:** CallMissed, Caller.digital, HuskyVoice, AI VOX, Carevoice and more. It's also **Bolna's own core use case**, so judges see 50 of these. Hard to be "exceptional". [list](https://www.callmissed.com/blog/ai-receptionist-medical-clinics-practical-2026) |
| **Govt-scheme navigator** (voice) | Strong: awareness gap well documented. [NextBillion](https://nextbillion.net/welfare-schemes-dont-work-if-nobody-knows-about-them-fixing-indias-information-deficit/) | **Microsoft/AI4Bharat's Jugalbandi** already exists, and Haqdarshak works on the ground. Accuracy risk on 20k schemes in 3 days. [Microsoft](https://news.microsoft.com/en-in/features/with-help-from-next-generation-ai-indian-villagers-gain-easier-access-to-government-services/) |
| **Farmer advisory** | Language barriers with KCC are proven. [VoxDev](https://voxdev.org/node/300554) | Kisan Call Centre exists in 22 languages, and Kisan e-Mitra too. We can't validate with farmers by Oct 31 |
| **Blue-collar hiring screening** | 10 calls per hire (WorkIndia CEO, 2022) | It's literally what Bolna already sells. Not differentiated |
| **IVR/customer-care hell** | Universal frustration | Best data is US. A consumer-side fix needs an "AI waits on hold for you" product, and Indian IVRs/telephony make that hard on free tiers |
| **Elderly loneliness / check-in calls** | Strong (HelpAge: 59% want more family time) | A great **feature**, not a wedge. We fold it into Ruko as an optional daily check-in that builds trust |
| ✅ **Scam second-opinion line for seniors** | **Massive, current, court-level, emotional, measurable in ₹** | Voice-native, underserved for feature-phone users, demo-able live |

---

## 7. Product concept: **Ruko**

### Core flow (MVP, must ship by Oct 31)
**"Call before you pay."** A senior (or anyone) calls or opens Ruko when someone on a call asks for money, OTPs, app installs or secrecy.

1. **Calm first.** *"Aap safe hain. Koi police ya CBI phone pe arrest nahi karti."* ("You're safe. Police or the CBI never arrest anyone over the phone.") Spoken in their language: Hindi, Hinglish, Tamil, Marathi and so on.
2. **Ask the right questions,** like the bank manager does: Who called? What did they say was wrong? What are they asking you to do? Did they tell you not to tell anyone?
3. **Match against known scam scripts** (courier/drugs, TRAI SIM block, Aadhaar money laundering, KYC update, "your son is arrested", electricity cut-off, APK install). These come from police and I4C advisories.
4. **Clear verdict and next step.** It **never** says "safe to pay". The default rule: *no government agency asks for money or secrecy on a call. Hang up.*
5. **Pull the family in.** Ruko auto-alerts the designated family member (WhatsApp, SMS or Telegram) with a short summary: *"Papa got a 'CBI' call about a FedEx parcel. Ruko advised hang up. Please call him."* This breaks the isolation, which is the scammer's main weapon.
6. **If money already moved, run golden-hour mode.** It walks them step by step: call 1930, call the bank's fraud line to freeze, and note the transaction ID, time and UPI ID. Then it generates a **ready-to-read complaint summary** for 1930 or cybercrime.gov.in, so a panicking person doesn't have to compose it.

### "Wow" features (if time allows)
- **Scam drill (inoculation call):** with the family's consent, Ruko places a **safe practice scam call** to the parent. Seconds after the "scam" begins, it reveals *"this is a practice call from your son's Ruko"* and coaches them. This is backed by the interactive-inoculation research in §5. **Live stage demo:** call a judge's phone.
- **Family dashboard:** a log of calls, red flags detected and alerts sent.
- **Daily check-in** (loneliness plus trust building), so Ruko is a familiar voice before the scam ever happens.

### Why this can win
- **Pain:** ₹ crores, Supreme Court, PM's Mann Ki Baat. Every judge has a parent or relative this could happen to.
- **Voice is essential, not decorative.** Feature-phone seniors can't use apps, but they can talk.
- **India-first and multilingual,** which plays to the sponsors: Sarvam (Indic STT/TTS), Bolna (voice agents), Plivo (telephony), Deepgram, Cartesia.
- **Clear wedge to a startup** (the YC angle): B2C family plan, plus **B2B2C via banks** (they already train staff to intervene; Ruko scales that), insurers, senior-living communities, and police cyber cells.
- **Measurable impact:** "₹ saved", "minutes to family alert" and "complaint filed within golden hour".

### Risks and how we handle them
| Risk | Mitigation |
|---|---|
| AI wrongly says a real call is fine | Ruko **never approves payments**. The default is always "hang up, verify via official number, tell family". Asymmetric safety |
| Drill calls scare seniors | Explicit family opt-in, reveal within ~10 seconds, warm debrief, no real agency names on the drill (generic "courier") |
| Privacy | Store only summaries, no audio. The family sees alerts, not full transcripts |
| Victim is "locked" on the scammer's video call and can't call us | Pre-arm: the family saves Ruko as a contact ("Ruko - Pehle Pucho"). Drills build the habit. The check-in call creates a routine touchpoint |

---

## 8. Free tech stack (no paid credits)

| Layer | Option | Free allowance (⚠️ verify on signup) |
|---|---|---|
| Voice agent orchestration | **Bolna** | Reportedly ~$5 signup credits (third-party claim). Has **"Test via browser"** and **"Get call from agent"** test calls without buying a number. Web Call SDK is beta, enabled on request via Slack. Custom function calls plus webhooks. [Agent setup](https://www.bolna.ai/docs/agent-setup/overview.md), [Web call](https://www.bolna.ai/docs/sdks/web-call), [Tools](https://www.bolna.ai/docs/agent-setup/tools-tab) |
| Indic STT/TTS | **Sarvam** | ₹100 free credits (official docs). [Pricing](https://docs.sarvam.ai/api/pricing.md) |
| STT | **Deepgram** | $200 signup credits. [Startup page](https://deepgram.com/startup-program) |
| TTS | **Cartesia** | 10K chars/month free (non-commercial). [Pricing](https://cartesia.ai/pricing) |
| LLM | **Groq** free tier / **Gemini** free tier | Rate-limited, no card. Limits vary. [Groq](https://community.groq.com/t/is-there-a-free-tier-and-what-are-its-limits/790) |
| Telephony | **Plivo** | $10 trial, but **Indian numbers need an India-registered business plus KYC**. Avoid for the MVP and use Bolna's test-call and browser paths. [Plivo India](https://www.plivo.com/docs/voice/concepts/india-calling) |
| Family alerts | Telegram bot (free, instant) / email; WhatsApp Cloud API test number | Telegram is the zero-friction path for a demo |
| Frontend + backend | Next.js on Vercel (free hobby tier) | Landing page, family setup, dashboard, Bolna webhooks |

**Ask the buildathon organizers in Bolna Slack:** the FAQ lists "Can I get credits for my project?". Ask on day one.

---

## 9. Validation plan (do this alongside building, it's what makes the pitch credible)

Judges, and YC, reward **real user feedback**. In the next 48 hours:

1. **Interview 5–8 people:** 3+ seniors (parents, grandparents, neighbours, building society) and 3+ adult children.
   - "Have you or someone you know got a call like this?" (Expect yes. Note the details.)
   - "What did you do? Who did you tell? How long before you told someone?"
   - "Would you call a number like this before paying? What would stop you?"
   - "What language would you want it in? Male or female voice?"
   - To the children: "Would you set this up for your parents? Would you pay ₹99/month?"
2. **Put the prototype in front of 2–3 seniors.** Record (with consent) the reaction quotes, plus one drill call. This footage goes in the pitch video.
3. **Paste the Reddit threads here** (see §1 action item).
4. **Track:** % who'd use it, the top objections, the preferred language, and willingness to pay.

### Interview notes
_(fill in)_

### Reddit threads (pasted manually)
_(fill in)_

---

## 10. Open questions before building
- [ ] Does Bolna's free tier include enough minutes for testing plus the demo? Can we get buildathon credits?
- [ ] Is Bolna's Web Call SDK enabled for us, or do we use dashboard browser-test plus phone test-call for the demo?
- [ ] Which languages for the MVP? Suggested: **Hindi + Hinglish + English**, with one regional (Tamil or Marathi) if Sarvam quality holds.
- [ ] Who is the team (1–4)? Split: agent prompt + scam-script KB / backend + webhooks + alerts / landing page + dashboard / pitch deck + video + interviews.
