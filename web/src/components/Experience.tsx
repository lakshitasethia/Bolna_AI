"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RukoWorld } from "./scene/RukoWorld";
import { Ambient, speakGreeting } from "./scene/ambient";
import { NUMBERS, SCAMS, STEPS } from "./content";
import styles from "./Experience.module.css";

type Phase = "loading" | "gate" | "entered";

/** Scroll length of each camera move, in viewport heights. */
const SEGMENT_VH = 150;
const STAGES = 5;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function Experience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<RukoWorld | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const ambientRef = useRef<Ambient | null>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState(false);
  const [talking, setTalking] = useState(false);
  const [bubble, setBubble] = useState(false);

  // Boot: build the 3D world, run the loader, drive everything from one loop.
  useEffect(() => {
    let cancelled = false;
    let ready = false;
    const started = performance.now();

    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.075, wheelMultiplier: 0.9 });
    lenis.stop();
    lenisRef.current = lenis;

    Promise.all([import("./scene/RukoWorld"), document.fonts.ready]).then(([mod]) => {
      if (cancelled || !canvasRef.current) return;
      worldRef.current = new mod.RukoWorld(canvasRef.current);
      ready = true;
      measure();
    });

    // Layout is measured once (and on resize), never inside the frame loop.
    type Item = { el: HTMLElement; top: number; h: number; last: string };
    let panels: { el: HTMLElement; i: number; last: string }[] = [];
    let reveals: Item[] = [];
    let lists: { items: Item[]; best: Item | null }[] = [];
    let rises: Item[] = [];
    let journeyH = 0;
    const measure = () => {
      const root = rootRef.current;
      if (!root || !journeyRef.current) return;
      const y = window.scrollY;
      const item = (el: HTMLElement): Item => {
        const r = el.getBoundingClientRect();
        return { el, top: r.top + y, h: r.height, last: "" };
      };
      journeyH = journeyRef.current.offsetHeight;
      panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")].map((el) => ({ el, i: Number(el.dataset.panel), last: "" }));
      reveals = [...root.querySelectorAll<HTMLElement>("[data-reveal]")].map(item);
      lists = [...root.querySelectorAll<HTMLElement>("[data-list]")].map((list) => ({
        items: [...list.querySelectorAll<HTMLElement>("[data-item]")].map(item),
        best: null,
      }));
      rises = [...root.querySelectorAll<HTMLElement>("[data-rise]:not([data-in])")].map(item);
    };
    const observer = new ResizeObserver(() => measure());
    if (rootRef.current) observer.observe(rootRef.current);
    measure();

    // The gate's soft glow trails the cursor.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const glow = { ...target };
    const onPointer = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener("pointermove", onPointer);

    let value = 0;
    let gateShown = false;
    let raf = 0;
    const onFrame = (time: number) => {
      raf = requestAnimationFrame(onFrame);
      lenis.raf(time);

      if (!gateShown) {
        const done = ready && performance.now() - started > 2200;
        value += ((done ? 100 : 90) - value) * (done ? 0.12 : 0.03);
        setProgress(Math.min(100, Math.round(value)));
        if (Math.round(value) >= 100) {
          gateShown = true;
          setTimeout(() => !cancelled && setPhase("gate"), 250);
        }
      }

      const root = rootRef.current;
      if (!root || !journeyH) return;
      const vh = window.innerHeight;
      const y = lenis.scroll;

      if (glowRef.current && root.dataset.phase !== "entered") {
        glow.x += (target.x - glow.x) * 0.08;
        glow.y += (target.y - glow.y) * 0.08;
        glowRef.current.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0)`;
      }

      const s = clamp01(y / (journeyH - vh)) * STAGES;
      worldRef.current?.setStage(s);
      worldRef.current?.setActive(y < journeyH);
      worldRef.current?.frame();

      // Text panels: leave early in a segment, arrive late, glitch in between.
      const k = Math.min(Math.floor(s), STAGES - 1);
      const f = s - k;
      for (const p of panels) {
        let o = 0;
        if (p.i === k) o = 1 - smooth(0.08, 0.32, f);
        else if (p.i === k + 1) o = smooth(0.78, 0.98, f);
        if (s >= STAGES) o = 0;
        const key = o.toFixed(3);
        if (key === p.last) continue;
        p.last = key;
        p.el.style.setProperty("--o", key);
        p.el.style.setProperty("--g", (o > 0 && o < 1 ? 1 - o : 0).toFixed(3));
        p.el.style.visibility = o > 0.001 ? "visible" : "hidden";
      }
      if (flashRef.current) {
        const flash = s >= STAGES ? 1 : k === STAGES - 1 ? smooth(0.55, 0.95, f) : 0;
        flashRef.current.style.opacity = flash.toFixed(3);
      }
      const theme = s > STAGES - 0.25 ? "light" : "dark";
      if (root.dataset.theme !== theme) root.dataset.theme = theme;
      if (y < journeyH - vh) return;

      // Words light up as their paragraph scrolls through the viewport.
      for (const r of reveals) {
        const key = clamp01((vh * 0.85 - (r.top - y)) / (r.h + vh * 0.35)).toFixed(3);
        if (key !== r.last) r.el.style.setProperty("--p", (r.last = key));
      }

      // Lists highlight the row nearest the middle of the screen.
      for (const list of lists) {
        let best: Item | null = null;
        let bestDist = Infinity;
        for (const it of list.items) {
          const dist = Math.abs(it.top - y + it.h / 2 - vh * 0.5);
          const key = clamp01(dist / (vh * 0.45)).toFixed(2);
          if (key !== it.last) it.el.style.setProperty("--d", (it.last = key));
          if (dist < bestDist) {
            bestDist = dist;
            best = it;
          }
        }
        if (best !== list.best) {
          list.best?.el.removeAttribute("data-active");
          best?.el.setAttribute("data-active", "");
          list.best = best;
        }
      }

      // Cards and blocks rise in once.
      if (rises.length) {
        rises = rises.filter((r) => {
          if (r.top - y > vh * 0.92) return true;
          r.el.setAttribute("data-in", "");
          return false;
        });
      }
    };
    raf = requestAnimationFrame(onFrame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      lenis.destroy();
      stopVoiceRef.current?.();
      ambientRef.current?.stop();
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, []);

  const enter = useCallback((withSound: boolean) => {
    setPhase("entered");
    worldRef.current?.intro();
    setTimeout(() => lenisRef.current?.start(), 1600);
    if (withSound) {
      ambientRef.current ??= new Ambient();
      ambientRef.current.start();
      setSound(true);
    }
    setTimeout(() => setBubble(true), 3200);
  }, []);

  const toggleSound = () => {
    ambientRef.current ??= new Ambient();
    if (sound) ambientRef.current.stop();
    else ambientRef.current.start();
    setSound(!sound);
  };

  const talk = () => {
    if (talking) {
      stopVoiceRef.current?.();
      setTalking(false);
      worldRef.current?.setVoiceLevel(0);
      return;
    }
    setTalking(true);
    setBubble(false);
    stopVoiceRef.current = speakGreeting(
      (level) => worldRef.current?.setVoiceLevel(level),
      () => {
        setTalking(false);
        worldRef.current?.setVoiceLevel(0);
      },
    );
  };

  const entered = phase === "entered";
  const pct = String(progress).padStart(3, "0");

  return (
    <main ref={rootRef} className={styles.root} data-phase={phase} data-theme="dark">
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      <div className={styles.vignette} aria-hidden />
      <div ref={flashRef} className={styles.flash} aria-hidden />

      {/* ---------- Loader + entry gate ---------- */}
      <section className={styles.loader} aria-hidden={entered}>
        <div ref={glowRef} className={styles.cursorGlow} aria-hidden />
        <div className={styles.loaderCenter}>
          <Logo className={styles.loaderLogo} />
          <p className={styles.mono}>
            A second voice before you pay.
            <br />
            In Hindi, Hinglish &amp; your language.
          </p>
        </div>
        {phase === "loading" ? (
          <div className={styles.progress}>
            <div className={styles.track}>
              <div className={styles.fill} style={{ transform: `scaleX(${progress / 100})` }} />
            </div>
            <div className={styles.progressLabels}>
              <span>Scam shield</span>
              <span>Is loading</span>
              <span>Please</span>
              <span>Wait</span>
              <span className={styles.pct}>{pct}%</span>
              <span className={styles.dark}>Out of</span>
              <span className={styles.dark}>100%</span>
            </div>
          </div>
        ) : (
          <div className={styles.gate}>
            <button className={styles.glassBtn} onPointerMove={followGlow} onClick={() => enter(true)}>
              <SpeakerIcon /> Enter with sound
            </button>
            <button className={styles.enterMute} onClick={() => enter(false)}>
              <MuteIcon /> Enter without sound
            </button>
          </div>
        )}
      </section>

      {/* ---------- Nav ---------- */}
      <header className={styles.nav}>
        <a href="#top" className={styles.navLogo} aria-label="Ruko home">
          <Logo />
        </a>
        <nav className={styles.links}>
          <a href="#how">How it works</a>
          <a href="#scams">Scams we catch</a>
          <a href="#numbers">The numbers</a>
        </nav>
        <button className={styles.lang} type="button">
          <GlobeIcon /> हिंदी / EN
        </button>
        <button className={styles.soundBtn} onClick={toggleSound} aria-label={sound ? "Mute" : "Unmute"}>
          {sound ? <SpeakerIcon /> : <MuteIcon />}
        </button>
        <button className={styles.cta} onClick={talk}>
          {talking ? "Stop" : "Talk to Ruko"} <ReturnIcon />
        </button>
      </header>

      {/* ---------- 3D journey: fixed panels over the scene ---------- */}
      <div ref={journeyRef} id="top" className={styles.journey} style={{ height: `${STAGES * SEGMENT_VH + 100}vh` }}>
        <section data-panel="0" className={`${styles.panel} ${styles.heroPanel}`}>
          <p className={`${styles.mono} ${styles.kicker}`}>
            A voice AI that stops phone scams
            <br />
            for our parents, in their language
          </p>
          <h1 className={styles.headline}>
            <span className={styles.italicLead}>
              <span className={styles.line}>
                <span style={{ transitionDelay: "0.9s" }}>Before</span>
              </span>
            </span>
            {["You pay anyone", "who called you,", "call Ruko"].map((text, i) => (
              <span key={text} className={styles.line}>
                <span style={{ transitionDelay: `${1.05 + i * 0.12}s` }}>{text}</span>
              </span>
            ))}
          </h1>
        </section>

        <section data-panel="1" className={`${styles.panel} ${styles.panelLeftTop}`}>
          <span className={styles.tag}>The problem</span>
          <h2 className={styles.panelTitle}>
            <em>Every</em> second
            <br />
            <span className={styles.indent}>
              <ReturnIcon className={styles.titleArrow} />
              244 scam calls
            </span>
            <br />
            ring someone
            <br />
            in India
          </h2>
          <p className={`${styles.mono} ${styles.panelNote}`}>
            770 crore fraud calls in 2025. ₹22,495 crore lost.
            <br />
            The people losing most: our parents.
          </p>
        </section>

        <section data-panel="2" className={`${styles.panel} ${styles.panelBottomSplit}`}>
          <div>
            <span className={styles.tag}>Why it works</span>
            <h2 className={styles.panelTitle}>
              Scams live
              <br />
              <span className={styles.indent}>
                <ReturnIcon className={styles.titleArrow} />
                in silence
              </span>
            </h2>
          </div>
          <p className={`${styles.mono} ${styles.panelNote}`}>
            “Don’t hang up. Don’t tell anyone.” Isolation is the weapon.
            <br />
            Every rescue we found began with a second voice.
          </p>
        </section>

        <section data-panel="3" className={`${styles.panel} ${styles.panelRight}`}>
          <span className={styles.tag}>The fix</span>
          <h2 className={styles.panelTitle}>
            A second <em>Voice</em>
            <br />
            in the moment
          </h2>
          <p className={`${styles.mono} ${styles.panelNote}`}>
            Papa calls Ruko. Ruko listens in Hindi, asks what a bank
            <br />
            manager would, spots the script, and says: hang up.
          </p>
        </section>

        <section data-panel="4" className={`${styles.panel} ${styles.heroPanel}`}>
          <div className={styles.kickerBlock}>
            <span className={styles.tag}>For families</span>
            <p className={styles.mono}>
              The moment Ruko spots a scam,
              <br />
              your family knows
            </p>
          </div>
          <h2 className={`${styles.headline} ${styles.headlineStatic}`}>
            <span className={styles.italicLead}>
              We <ReturnIcon className={styles.leadArrow} />
            </span>
            Never let our
            <br />
            parents face it
            <br />
            alone
          </h2>
        </section>
      </div>

      {/* ---------- Content ---------- */}
      <div className={styles.content}>
        <section id="how" className={styles.how}>
          <div className={styles.howLeft}>
            <p className={styles.reveal} data-reveal>
              <span className={styles.tagInline}>How it works</span>
              <ReturnIcon className={styles.revealArrow} />
              {splitWords(
                "Papa gets a call from a ‘CBI officer’. Before he pays a rupee, he calls Ruko. Ruko calms him in Hindi, asks four simple questions, recognises the script, tells him to hang up — and messages his son on Telegram. If money already left, Ruko walks him through 1930 and the bank freeze inside the golden hour.",
              )}
            </p>
            <button className={styles.glassBtn} onPointerMove={followGlow} onClick={talk} data-rise>
              Try Ruko now <ReturnIcon />
            </button>
          </div>
          <ol className={styles.steps} data-list>
            {STEPS.map((step, i) => (
              <li key={step} data-item>
                <span className={styles.stepNum}>({String(i + 1).padStart(3, "0")})</span>
                <ReturnIcon className={styles.stepArrow} />
                <span className={styles.stepLabel}>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="scams" className={styles.scams}>
          <h2 className={styles.spreadTitle}>
            <span>Scripts</span>
            <em>Ruko</em>
            <span className={styles.dash} aria-hidden />
            <span>recognises</span>
          </h2>
          <p className={`${styles.mono} ${styles.spreadNote}`}>
            The same few scripts drain crores. Ruko knows every
            <br />
            one of them, in every language your parents speak
          </p>
          <div className={styles.cards}>
            {SCAMS.map((scam, i) => (
              <article key={scam.name} className={styles.card} data-rise style={{ "--i": i } as React.CSSProperties}>
                <div className={styles.cardArt} data-tone={scam.tone}>
                  <dl className={styles.cardMeta}>
                    <dt>Script</dt>
                    <dd>/{String(i + 1).padStart(2, "0")}</dd>
                    <dt>Starts as</dt>
                    <dd>{scam.starts}</dd>
                    <dt>Moves to</dt>
                    <dd>{scam.moves}</dd>
                    <dt>Asks for</dt>
                    <dd>{scam.asks}</dd>
                    <dt>Ruko says</dt>
                    <dd>Hang up.</dd>
                  </dl>
                  <p className={styles.cardQuote}>“{scam.quote}”</p>
                </div>
                <p className={styles.cardTags}>{scam.tags}</p>
                <h3 className={styles.cardName}>{scam.name}</h3>
              </article>
            ))}
          </div>
        </section>

        <section id="numbers" className={styles.numbers}>
          <div className={styles.numbersHead}>
            <h2 className={styles.bigTitle}>
              The numbers
              <br />
              don’t lie
            </h2>
            <p className={styles.mono}>
              Every figure is from government data, courts
              <br />
              or published reports. Sources in our research
            </p>
            <span className={styles.tag}>Lost in 2025: ₹22,495 cr</span>
          </div>
          {NUMBERS.map((group) => (
            <div key={group.source} className={styles.numberGroup} data-list>
              <h3>
                {group.source} <sup>[{group.rows.length}]</sup>
              </h3>
              <ul>
                {group.rows.map(([label, value]) => (
                  <li key={label} data-item>
                    <span>{label}</span>
                    <span className={styles.numberValue}>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <footer className={styles.footer}>
          <div>
            <span className={styles.tag}>Stay safe</span>
            <h2 className={styles.bigTitle}>
              <em>Let’s</em> make
              <br />
              <span className={styles.indent}>
                <ReturnIcon className={styles.titleArrow} />
                every parent
              </span>
              <br />
              scam-proof
            </h2>
            <button className={styles.glassBtn} onPointerMove={followGlow} onClick={talk}>
              Talk to Ruko <ReturnIcon />
            </button>
          </div>
          <div className={styles.footerCols}>
            <p className={`${styles.mono} ${styles.footerNote}`}>
              Strange call right now? Hang up first.
              <br />
              Then call Ruko — or the national helpline, 1930.
            </p>
            <FooterCol
              title="In an emergency"
              items={[
                ["Call 1930", "tel:1930"],
                ["cybercrime.gov.in", "https://cybercrime.gov.in"],
                ["Your bank’s fraud line", undefined],
              ]}
            />
            <FooterCol
              title="Pages"
              items={[
                ["Home", "#top"],
                ["How it works", "#how"],
                ["Scams we catch", "#scams"],
                ["The numbers", "#numbers"],
              ]}
            />
            <FooterCol title="Languages" items={[["Hindi · Hinglish", undefined], ["English", undefined], ["Tamil · Marathi", undefined]]} />
            <FooterCol title="Built for" items={[["Bolna Buildathon", undefined], ["Symphony 2026", undefined]]} />
          </div>
          <div className={styles.footerBar}>
            <span>© 2026 Ruko. Made in India.</span>
            <span className={styles.mono}>Ruko. Socho. Action lo.</span>
            <span>Privacy</span>
          </div>
        </footer>
      </div>

      {/* ---------- Assistant orb ---------- */}
      <div className={styles.assistant}>
        <p className={`${styles.bubble} ${bubble && !talking ? styles.bubbleOn : ""}`}>
          Namaste! Got a strange call? Tap me and tell me what happened.
        </p>
        <button
          className={`${styles.orb} ${talking ? styles.orbTalking : ""}`}
          onClick={talk}
          aria-label="Talk to Ruko"
        />
      </div>
    </main>
  );
}

/** Moves a glass button's inner glow to the cursor. */
function followGlow(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
}

function splitWords(text: string) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <span key={i} className={styles.word} style={{ "--i": (i / words.length).toFixed(3) } as React.CSSProperties}>
      {word}{" "}
    </span>
  ));
}

function FooterCol({ title, items }: { title: string; items: [string, string | undefined][] }) {
  return (
    <div className={styles.footerCol}>
      <h4>
        {title} <span aria-hidden>↴</span>
      </h4>
      <ul>
        {items.map(([label, href], i) => (
          <li key={label}>
            <span className={styles.footerIdx}>[{String(i + 1).padStart(2, "0")}]</span>
            {href ? (
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {label} {href.startsWith("http") || href.startsWith("tel") ? "↗" : ""}
              </a>
            ) : (
              <span>{label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <span className={className}>
      ru<span className={styles.logoAccent}>ko</span>
    </span>
  );
}

function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" strokeLinejoin="round" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" strokeLinejoin="round" />
      <path d="M17 10l4 4M21 10l-4 4" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </svg>
  );
}

function ReturnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 4v8a3 3 0 0 0 3 3h10M15 11l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
