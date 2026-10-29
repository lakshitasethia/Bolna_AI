"use client";

import { useEffect, useRef, useState } from "react";
import { CallCard } from "@/components/CallCard";
import Nav from "@/components/Nav";
import { DEMO_CONTACTS, DEMO_LOAD } from "@/lib/demo.ts";
import { inr } from "@/lib/negotiate.ts";
import type { Contact, Load } from "@/lib/types.ts";
import styles from "./desk.module.css";

type Form = typeof DEMO_LOAD;

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

export default function Desk() {
  const [form, setForm] = useState<Form>(DEMO_LOAD);
  const [contacts, setContacts] = useState<Contact[]>(DEMO_CONTACTS);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [mode, setMode] = useState<"sim" | "live">("sim");
  const [load, setLoad] = useState<Load | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c: { live: boolean }) => setLiveAvailable(c.live))
      .catch(() => setLiveAvailable(false));
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const updateContact = (id: string, patch: Partial<Contact>) =>
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addContact = () =>
    setContacts((cs) => [
      ...cs,
      { id: `c_${Date.now()}`, name: "", phone: "", city: "", truck: form.truck, persona: simPersona(form, cs.length) },
    ]);

  async function startCalls(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStarting(true);
    if (poll.current) clearInterval(poll.current);

    const owners = contacts.filter((c) => c.name.trim());
    const res = await fetch("/api/loads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contacts: owners, mode }),
    }).catch(() => null);
    setStarting(false);

    if (!res) return setError("Couldn't reach the server. Check that it's running and try again.");
    const body = await res.json();
    if (!res.ok) return setError(body.error ?? "The load couldn't be posted.");

    setLoad(body);
    poll.current = setInterval(async () => {
      const r = await fetch(`/api/loads/${body.id}`).catch(() => null);
      if (!r?.ok) return;
      const next: Load = await r.json();
      setLoad(next);
      if (next.status !== "calling" && poll.current) clearInterval(poll.current);
    }, 700);
  }

  const calling = load?.status === "calling";

  return (
    <>
      <Nav cta={false} />
      <main className={styles.page}>
        <div className={styles.window}>
          <div className={styles.chrome} aria-hidden>
            <span />
            <span />
            <span />
          </div>

          <form className={styles.form} onSubmit={startCalls}>
            <h1 className={styles.title}>New load</h1>

            <fieldset className={styles.group}>
              <legend>Route</legend>
              <div className={styles.row}>
                <label>
                  Pickup
                  <input value={form.from} onChange={(e) => set("from", e.target.value)} required />
                </label>
                <label>
                  Drop
                  <input value={form.to} onChange={(e) => set("to", e.target.value)} required />
                </label>
              </div>
              <label>
                When (as you&apos;d say it on the phone)
                <input value={form.pickup} onChange={(e) => set("pickup", e.target.value)} required />
              </label>
              <div className={styles.row}>
                <label>
                  Truck
                  <input value={form.truck} onChange={(e) => set("truck", e.target.value)} required />
                </label>
                <label>
                  Weight (ton)
                  <input
                    type="number"
                    min={1}
                    value={form.weightTons}
                    onChange={(e) => set("weightTons", Number(e.target.value))}
                    required
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Budget</legend>
              <div className={styles.row}>
                <label>
                  Open at (₹)
                  <input
                    type="number"
                    step={500}
                    value={form.target}
                    onChange={(e) => set("target", Number(e.target.value))}
                    required
                  />
                </label>
                <label>
                  Never above (₹)
                  <input
                    type="number"
                    step={500}
                    value={form.ceiling}
                    onChange={(e) => set("ceiling", Number(e.target.value))}
                    required
                  />
                </label>
              </div>
              <p className={styles.hint}>Owners never hear your maximum. Bhaada moves up in ₹500 steps.</p>
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Owners to call</legend>
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
                    <input
                      aria-label="Phone"
                      placeholder={mode === "live" ? "Phone (verified)" : "Phone"}
                      inputMode="tel"
                      value={c.phone}
                      onChange={(e) => updateContact(c.id, { phone: e.target.value })}
                    />
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
              <legend>Calls</legend>
              <div className={styles.modes} role="radiogroup" aria-label="Call mode">
                <label data-checked={mode === "sim"}>
                  <input type="radio" name="mode" checked={mode === "sim"} onChange={() => setMode("sim")} />
                  Simulated owners
                </label>
                <label data-checked={mode === "live"} data-disabled={!liveAvailable}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "live"}
                    disabled={!liveAvailable}
                    onChange={() => setMode("live")}
                  />
                  Real calls via Bolna
                </label>
              </div>
              {!liveAvailable && (
                <p className={styles.hint}>Real calls switch on once BOLNA_API_KEY and BOLNA_AGENT_ID are set on the server.</p>
              )}
            </fieldset>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button className={styles.start} type="submit" disabled={starting || calling}>
              {calling ? "Calling owners…" : starting ? "Posting…" : "Start calling"}
            </button>
          </form>

          <section className={styles.calls} aria-label="Calls">
            {!load && (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>No calls yet</p>
                <p>Post the load and Bhaada starts calling the owners on your list. You&apos;ll see every price as it happens.</p>
              </div>
            )}

            {load && (
              <>
                <div className={styles.banner} data-state={load.status}>
                  {load.status === "calling" && <>Calling {load.calls.length} owners for {load.from} to {load.to}</>}
                  {load.status === "booked" && load.booking && (
                    <>
                      <strong>
                        Booked {load.booking.ownerName} at {inr(load.booking.rate)}
                      </strong>
                      <span>
                        {load.booking.vehicle}, {inr(load.booking.savedVsCeiling)} under your max, {load.booking.seconds}s
                      </span>
                    </>
                  )}
                  {load.status === "no_truck" && (
                    <>
                      <strong>No truck within budget</strong>
                      <span>Raise the maximum or add more owners, then start again.</span>
                    </>
                  )}
                </div>
                <div className={styles.cards}>
                  {load.calls.map((c) => (
                    <CallCard key={c.id} call={c} lines={4} />
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
