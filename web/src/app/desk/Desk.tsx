"use client";

import { useEffect, useRef, useState } from "react";
import type { BolnaWebCall } from "@bolna/web-call";
import { Board } from "@/components/Board";
import { CallCard } from "@/components/CallCard";
import Nav from "@/components/Nav";
import { DEMO_CONTACTS, DEMO_LOAD } from "@/lib/demo.ts";
import { SAMPLE_INTAKE } from "@/lib/intake.ts";
import { hasPhone, noTruckReason } from "@/lib/loads.ts";
import { inr } from "@/lib/negotiate.ts";
import type { Contact, Load, Turn } from "@/lib/types.ts";
import styles from "./desk.module.css";

type Form = typeof DEMO_LOAD;

// The boxes start empty: the transporter's call or their typing fills them.
const EMPTY_FORM: Form = {
  transporter: DEMO_LOAD.transporter,
  from: "",
  to: "",
  pickup: "",
  truck: "",
  weightTons: 0,
  target: 0,
  ceiling: 0,
};

// The transporter's side of a phone-in: a sample call played on the desk, or
// a real web call to the Bolna intake agent.
interface Line {
  kind: "sample" | "live";
  state: "connecting" | "ringing" | "active" | "posting" | "ended";
  turns: Turn[];
}

const LINE_LABEL: Record<Line["state"], string> = {
  connecting: "Connecting",
  ringing: "Ringing",
  active: "On the call",
  posting: "Posting the load",
  ended: "Call ended",
};

// New owners added in simulated mode get a plausible bargaining style.
function simPersona(form: Form, i: number): Contact["persona"] {
  return {
    available: true,
    open: form.ceiling + 2000 + i * 500,
    floor: form.target + 1000 + (i % 3) * 1000,
    concede: 1500,
    vehicle: `DL1L ${["AB", "CK", "MX"][i % 3]} ${4000 + i * 137}`,
    driver: "Ramesh",
    driverPhone: "98100 00000",
  };
}

// What the agent has to hear before it can post a load.
const DETAILS: (keyof Form)[] = ["from", "to", "pickup", "truck", "weightTons", "ceiling"];

interface Health {
  caller: boolean;
  intake: boolean;
  linked: boolean;
}

const newSession = () => `desk_${Math.random().toString(36).slice(2, 10)}`;

export default function Desk() {
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [contacts, setContacts] = useState<Contact[]>(DEMO_CONTACTS);
  const [config, setConfig] = useState<{ live: boolean; intake: boolean; phoneIn: string[] }>({
    live: false,
    intake: false,
    phoneIn: [],
  });
  const [health, setHealth] = useState<Health | null>(null);
  const [heard, setHeard] = useState<(keyof Form)[]>([]);
  const [mode, setMode] = useState<"sim" | "live">("sim");
  const [load, setLoad] = useState<Load | null>(null);
  const [line, setLine] = useState<Line | null>(null);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const watch = useRef<ReturnType<typeof setInterval> | null>(null);
  const webCall = useRef<BolnaWebCall | null>(null);
  const sdk = useRef<typeof import("@bolna/web-call") | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c: { live: boolean; intake: boolean; phoneIn?: string[] }) => {
        setConfig({ ...c, phoneIn: c.phoneIn ?? [] });
        // Load the SDK early: start() has to run inside the click, with no await before it.
        if (c.intake) import("@bolna/web-call").then((m) => (sdk.current = m));
      })
      .catch(() => undefined);
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ caller: false, intake: false, linked: false }));
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      if (poll.current) clearInterval(poll.current);
      if (watch.current) clearInterval(watch.current);
      void webCall.current?.stop();
    };
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const updateContact = (id: string, patch: Partial<Contact>) =>
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addContact = () =>
    setContacts((cs) => [
      ...cs,
      { id: `c_${Date.now()}`, name: "", phone: "", city: "", truck: form.truck },
    ]);

  // A row counts once it has a name or a number.
  const filledContacts = () =>
    contacts.filter((c) => c.name.trim() || c.phone.trim()).map((c) => (c.name.trim() ? c : { ...c, name: "Owner" }));

  function reset() {
    setError(null);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (poll.current) clearInterval(poll.current);
    if (watch.current) clearInterval(watch.current);
  }

  // Clears the desk for the next load. A call still on the phones carries on
  // at the server; this only stops the desk watching it.
  function newLoad() {
    reset();
    setLoad(null);
    setLine(null);
    setForm(EMPTY_FORM);
    setHeard([]);
  }

  // Keep the desk in step with a load until it settles.
  function follow(id: string) {
    if (poll.current) clearInterval(poll.current);
    poll.current = setInterval(async () => {
      const r = await fetch(`/api/loads/${id}`).catch(() => null);
      if (!r?.ok) return;
      const next: Load = await r.json();
      setLoad(next);
      // A phone-in transcript can arrive from Bolna after the load settles.
      if (next.status !== "calling" && (next.source !== "phone" || next.intake) && poll.current) clearInterval(poll.current);
    }, 700);
  }

  async function post(body: object) {
    const res = await fetch("/api/loads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!res) return setError("Couldn't reach the server. Check that it's running and try again.");
    const next = await res.json();
    if (!res.ok) return setError(next.error ?? "The load couldn't be posted.");
    setLoad(next);
    follow(next.id);
  }

  async function startCalls(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setStarting(true);
    // Every number typed gets a real call, whichever mode is selected.
    const dialing = config.live && contacts.some((c) => c.phone.trim());
    if (dialing) setMode("live");
    // Owners added by hand bargain around the budget in the boxes at this moment.
    const owners = filledContacts().map((c, i) => ({ ...c, persona: c.persona ?? simPersona(form, i) }));
    await post({ ...form, contacts: owners, mode: dialing ? "live" : mode });
    setStarting(false);
  }

  // Plays a transporter phoning in, then posts the load they described.
  function sampleCall() {
    reset();
    setLoad(null);
    setHeard([]);
    setForm(DEMO_LOAD);
    const t0 = Date.now();
    const turns: Turn[] = [];
    setLine({ kind: "sample", state: "ringing", turns });
    SAMPLE_INTAKE.forEach((turn, i) => {
      timers.current.push(
        setTimeout(() => {
          turns.push({ ...turn, at: t0 + i * 1700 });
          setLine({ kind: "sample", state: "active", turns: [...turns] });
        }, 600 + i * 1700),
      );
    });
    timers.current.push(
      setTimeout(async () => {
        setLine({ kind: "sample", state: "posting", turns: [...turns] });
        await post({ ...DEMO_LOAD, contacts: DEMO_CONTACTS, mode: "sim", source: "phone", intake: turns });
        setLine({ kind: "sample", state: "ended", turns: [...turns] });
      }, 600 + SAMPLE_INTAKE.length * 1700),
    );
  }

  // A real call to the intake agent, from the browser. The load appears on
  // the desk once the agent posts it with the post_load tool.
  function phoneIn() {
    if (!sdk.current) return setError("The calling library is still loading. Try again in a second.");
    reset();
    const owners = filledContacts().filter((c) => c.phone.trim());
    const bad = owners.find((c) => !hasPhone(c));
    if (bad) return setError(`${bad.name} has a phone number that isn't valid: ${bad.phone}. Use 10 digits.`);
    setLoad(null);
    setForm(EMPTY_FORM);
    setHeard([]);
    const session = newSession();
    const call = new sdk.current.BolnaWebCall({
      sessionUrl: "/api/bolna/session",
      userData: { transporter: form.transporter, session_id: session, owners: JSON.stringify(owners) },
    });
    webCall.current = call;
    setLine({ kind: "live", state: "connecting", turns: [] });
    call.on("state-change", (state) => {
      if (state === "idle") return;
      setLine((l) => ({ kind: "live", turns: l?.turns ?? [], state: state as Line["state"] }));
    });
    call.on("volume-level", setLevel);
    call.on("call-end", () => setLevel(0));
    call.on("error", (err) => setError(`Phone-in failed: ${err.message}`));
    call.start().catch(() => undefined);

    const until = Date.now() + 6 * 60_000;
    watch.current = setInterval(async () => {
      if (Date.now() > until && watch.current) clearInterval(watch.current);
      const r = await fetch(`/api/loads?session=${session}`).catch(() => null);
      if (!r?.ok) {
        // Not posted yet: show what the transporter has said so far.
        const draft = await fetch(`/api/bolna/draft?session=${session}`).catch(() => null);
        const said = draft?.ok ? await draft.json() : {};
        setForm((f) => ({ ...f, ...said }));
        setHeard(Object.keys(said) as (keyof Form)[]);
        return;
      }
      const found: Load = await r.json();
      if (watch.current) clearInterval(watch.current);
      // Show what the transporter said in the form, ready to edit and run again.
      const { transporter, from, to, pickup, truck, weightTons, target, ceiling } = found;
      setForm({ transporter, from, to, pickup, truck, weightTons, target, ceiling });
      setHeard([...DETAILS, "target"]);
      setLoad(found);
      follow(found.id);
    }, 1500);
  }

  const hangUp = () => void webCall.current?.stop();

  const calling = load?.status === "calling";
  const onLine = line?.kind === "live" && ["connecting", "ringing", "active"].includes(line.state);
  const best = load?.board.findLast((e) => e.kind === "locked" || e.kind === "beat");
  const intake = load?.intake?.length ? load.intake : (line?.turns ?? []);
  const owners = filledContacts();
  const realCalls = owners.filter(hasPhone).length;
  const ready = Boolean(health?.caller && health.intake && health.linked);

  return (
    <>
      <Nav cta={false} />
      <main className={styles.page}>
        <header className={styles.head}>
          <p className="mono">Booking desk</p>
          <h1 className={styles.title}>One call in. Six agents out.</h1>
        </header>
        <ul className={`${styles.ready} mono`} aria-label="Demo readiness" aria-live="polite">
          {health ? (
            <>
              <li data-ok={health.caller}>Caller agent</li>
              <li data-ok={health.intake}>Intake agent</li>
              <li data-ok={health.linked}>Bolna reaches this server</li>
              <li data-ok={ready}>{ready ? "Ready for real calls" : "Simulated loads only"}</li>
            </>
          ) : (
            <li>Checking agents…</li>
          )}
        </ul>
        <div className={styles.window}>
          <div className={styles.form}>
            <section className={styles.group} aria-label="Transporter line">
              <p className={`${styles.legend} mono`}>[00] Phone it in</p>
              <p className={styles.lead}>
                The transporter calls Bhaada and says the load in Hindi. Bhaada starts an agent on every owner they work
                with.
              </p>
              <div className={styles.lineButtons}>
                {onLine ? (
                  <button type="button" className={styles.call} data-on onClick={hangUp}>
                    <span className={styles.meter} style={{ transform: `scaleY(${0.25 + level * 0.75})` }} aria-hidden />
                    Hang up
                  </button>
                ) : (
                  <button type="button" className={styles.call} onClick={phoneIn} disabled={!config.intake || calling}>
                    Call Bhaada
                  </button>
                )}
                <button type="button" className={styles.add} onClick={sampleCall} disabled={onLine || calling}>
                  Play a sample call
                </button>
                {(load || line) && (
                  <button type="button" className={styles.add} onClick={newLoad} disabled={onLine}>
                    New load
                  </button>
                )}
              </div>
              {config.phoneIn.length > 0 && (
                <p className={styles.hint}>A phone-in also rings {config.phoneIn.join(", ")}.</p>
              )}
              {!config.intake && (
                <p className={styles.hint}>Calling from the browser switches on once BOLNA_INTAKE_AGENT_ID is set on the server.</p>
              )}
              {(line || intake.length > 0) && (
                <div className={styles.intake}>
                  <p className={`${styles.intakeHead} mono`}>
                    <span>Transporter line</span>
                    <span>{line ? LINE_LABEL[line.state] : "Phoned in"}</span>
                  </p>
                  {line?.kind === "live" && (
                    <p className={`${styles.heardCount} mono`}>
                      {DETAILS.filter((d) => form[d]).length} of {DETAILS.length} details heard
                    </p>
                  )}
                  {intake.length > 0 ? (
                    <ul className={styles.intakeTurns}>
                      {intake.map((t, i) => (
                        <li key={i} data-who={t.who}>
                          <span className="mono">{t.who === "agent" ? "Bhaada" : "Transporter"}</span>
                          {t.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.hint}>
                      {line?.state === "connecting" && line.kind === "live"
                        ? "Connecting… If your browser asks, allow the microphone."
                        : line?.kind === "live"
                          ? "Speak to Bhaada. The boxes below fill in as you talk, and the transcript shows up here after the call."
                          : "Connecting…"}
                    </p>
                  )}
                </div>
              )}
            </section>

            <form onSubmit={startCalls}>
              <p className={`${styles.or} mono`}>Or type the load in</p>
              <fieldset className={styles.group}>
                <legend className="mono">[01] Route</legend>
                <div className={styles.row}>
                  <label>
                    Pickup
                    <input data-heard={heard.includes("from")} value={form.from} onChange={(e) => set("from", e.target.value)} required />
                  </label>
                  <label>
                    Drop
                    <input data-heard={heard.includes("to")} value={form.to} onChange={(e) => set("to", e.target.value)} required />
                  </label>
                </div>
                <label>
                  When (as you&apos;d say it on the phone)
                  <input data-heard={heard.includes("pickup")} value={form.pickup} onChange={(e) => set("pickup", e.target.value)} required />
                </label>
                <div className={styles.row}>
                  <label>
                    Truck
                    <input data-heard={heard.includes("truck")} value={form.truck} onChange={(e) => set("truck", e.target.value)} required />
                  </label>
                  <label>
                    Weight (ton)
                    <input
                      type="number"
                      min={1}
                      data-heard={heard.includes("weightTons")}
                      value={form.weightTons || ""}
                      onChange={(e) => set("weightTons", Number(e.target.value))}
                      required
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className={styles.group}>
                <legend className="mono">[02] Budget</legend>
                <div className={styles.row}>
                  <label>
                    Open at (₹)
                    <input
                      type="number"
                      step={500}
                      data-heard={heard.includes("target")}
                      value={form.target || ""}
                      onChange={(e) => set("target", Number(e.target.value))}
                      required
                    />
                  </label>
                  <label>
                    Never above (₹)
                    <input
                      type="number"
                      step={500}
                      data-heard={heard.includes("ceiling")}
                      value={form.ceiling || ""}
                      onChange={(e) => set("ceiling", Number(e.target.value))}
                      required
                    />
                  </label>
                </div>
                <p className={styles.hint}>
                  Owners never hear your maximum. Once one agrees, the other agents only book below that rate.
                </p>
              </fieldset>

              <fieldset className={styles.group}>
                <legend className="mono">[03] Owners, one agent each</legend>
                <ul className={styles.contacts}>
                  {contacts.map((c) => (
                    <li key={c.id}>
                      <input
                        aria-label="Owner name"
                        placeholder="Name"
                        value={c.name}
                        onChange={(e) => updateContact(c.id, { name: e.target.value })}
                      />
                      <input
                        aria-label="Area"
                        placeholder="Area"
                        value={c.city}
                        onChange={(e) => updateContact(c.id, { city: e.target.value })}
                      />
                      <span className={styles.phone}>
                        <input
                          aria-label="Phone"
                          placeholder="Blank to simulate"
                          inputMode="tel"
                          value={c.phone}
                          onChange={(e) => updateContact(c.id, { phone: e.target.value })}
                        />
                        {hasPhone(c) && <span className={`${styles.liveTag} mono`}>Live</span>}
                      </span>
                      <button
                        type="button"
                        className={styles.remove}
                        onClick={() => setContacts((cs) => cs.filter((x) => x.id !== c.id))}
                        aria-label={`Remove ${c.name || "owner"}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className={styles.add} onClick={addContact}>
                  Add owner
                </button>
              </fieldset>

              <fieldset className={styles.group}>
                <legend className="mono">[04] Calls</legend>
                <div className={styles.modes} role="radiogroup" aria-label="Call mode">
                  <label data-checked={mode === "sim"}>
                    <input type="radio" name="mode" checked={mode === "sim"} onChange={() => setMode("sim")} />
                    Simulated owners
                  </label>
                  <label data-checked={mode === "live"} data-disabled={!config.live}>
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "live"}
                      disabled={!config.live}
                      onChange={() => setMode("live")}
                    />
                    Real calls via Bolna
                  </label>
                </div>
                <p className={`${styles.callCount} mono`}>
                  {realCalls} real, {owners.length - realCalls} simulated
                </p>
                <p className={styles.hint}>
                  {config.live
                    ? "Every owner with a phone number gets a real call, in either mode. The rest are simulated and share the same agent channel."
                    : "Real calls switch on once BOLNA_API_KEY and BOLNA_AGENT_ID are set on the server."}
                </p>
              </fieldset>

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              <button className={styles.start} type="submit" disabled={starting || calling}>
                {calling ? "Agents on the phones…" : starting ? "Posting…" : `Start ${owners.length} agents`}
              </button>
            </form>
          </div>

          <section className={styles.calls} aria-label="Calls">
            {!load && (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>No calls yet</p>
                <p>
                  Phone a load in or type it in. Every owner gets their own agent at the same moment, and the agents share
                  each rate they lock so the rest can beat it.
                </p>
              </div>
            )}

            {load && (
              <>
                <div className={styles.banner} data-state={load.status}>
                  {load.status === "calling" && (
                    <>
                      <span>
                        {load.calls.length} agents on {load.from.split(",")[0]} to {load.to}
                      </span>
                      <strong>{best?.rate ? `Best so far ${inr(best.rate)}` : "Waiting for the first rate"}</strong>
                    </>
                  )}
                  {load.status === "booked" && load.booking && (
                    <>
                      <strong>
                        Booked {load.booking.ownerName} at {inr(load.booking.rate)}
                      </strong>
                      <span>
                        {load.from.split(",")[0]} to {load.to}, {load.pickup}
                      </span>
                      <dl className={styles.summary}>
                        <div>
                          <dt>Truck</dt>
                          <dd>{load.truck}</dd>
                        </div>
                        <div>
                          <dt>Vehicle</dt>
                          <dd>{load.booking.vehicle || "Pending"}</dd>
                        </div>
                        <div>
                          <dt>Driver</dt>
                          <dd>{load.booking.driverPhone || "Pending"}</dd>
                        </div>
                        <div>
                          <dt>Under your max</dt>
                          <dd>{inr(load.booking.savedVsCeiling)}</dd>
                        </div>
                        {load.booking.savedVsFirst > 0 && (
                          <div>
                            <dt>Under the first truck</dt>
                            <dd>{inr(load.booking.savedVsFirst)}</dd>
                          </div>
                        )}
                        <div>
                          <dt>Booked in</dt>
                          <dd>{load.booking.seconds}s</dd>
                        </div>
                      </dl>
                      {load.booking.detailsToCheck && (
                        <p className={styles.flag}>Vehicle or driver number unclear. Confirm with the owner.</p>
                      )}
                    </>
                  )}
                  {load.status === "no_truck" && (
                    <>
                      <strong>{noTruckReason(load)}</strong>
                      <span>
                        {noTruckReason(load) === "No truck within budget"
                          ? "Raise the maximum or add more owners, then start again."
                          : "The calls ended before anyone agreed a rate. Start again or add more owners."}
                      </span>
                    </>
                  )}
                </div>
                <Board events={load.board} start={load.createdAt} />
                <div className={styles.cards}>
                  {load.calls.map((c) => (
                    <CallCard key={c.id} call={c} lines={3} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
