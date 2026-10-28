"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RukoScene } from "./scene/RukoScene";
import { Ambient, speakGreeting } from "./scene/ambient";
import styles from "./Experience.module.css";

type Phase = "loading" | "gate" | "entered";

const HEADLINE = ["You pay anyone", "who called you,", "call Ruko"];

export default function Experience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<RukoScene | null>(null);
  const ambientRef = useRef<Ambient | null>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState(false);
  const [talking, setTalking] = useState(false);
  const [bubble, setBubble] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ready = false;
    const started = performance.now();

    Promise.all([import("./scene/RukoScene"), document.fonts.ready]).then(([mod]) => {
      if (cancelled || !canvasRef.current) return;
      sceneRef.current = new mod.RukoScene(canvasRef.current);
      ready = true;
    });

    // Progress eases towards 90% while the scene builds, then completes.
    let raf = 0;
    let value = 0;
    const step = () => {
      const minTimeDone = performance.now() - started > 2200;
      const target = ready && minTimeDone ? 100 : 90;
      value += (target - value) * (ready && minTimeDone ? 0.12 : 0.03);
      setProgress(Math.min(100, Math.round(value)));
      if (Math.round(value) >= 100) {
        setTimeout(() => !cancelled && setPhase("gate"), 250);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopVoiceRef.current?.();
      ambientRef.current?.stop();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const enter = useCallback((withSound: boolean) => {
    setPhase("entered");
    sceneRef.current?.intro();
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
      sceneRef.current?.setVoiceLevel(0);
      return;
    }
    setTalking(true);
    setBubble(false);
    stopVoiceRef.current = speakGreeting(
      (level) => sceneRef.current?.setVoiceLevel(level),
      () => {
        setTalking(false);
        sceneRef.current?.setVoiceLevel(0);
      },
    );
  };

  const entered = phase === "entered";
  const pct = String(progress).padStart(3, "0");

  return (
    <main className={styles.root} data-phase={phase}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      {/* Loader + entry gate */}
      <section className={styles.loader} aria-hidden={entered}>
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
            <button className={styles.enterSound} onClick={() => enter(true)}>
              <SpeakerIcon /> Enter with sound
            </button>
            <button className={styles.enterMute} onClick={() => enter(false)}>
              <MuteIcon /> Enter without sound
            </button>
          </div>
        )}
      </section>

      {/* Hero */}
      <header className={styles.nav}>
        <Logo className={styles.navLogo} />
        <nav className={styles.links}>
          <a href="#how">How it works</a>
          <a href="#families">For families</a>
          <a href="#problem">The problem</a>
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

      <section className={styles.hero}>
        <p className={`${styles.mono} ${styles.kicker}`}>
          A voice AI that stops phone scams
          <br />
          for our parents, in their language
        </p>
        <h1 className={styles.headline}>
          <span className={styles.italic}>
            <span className={styles.line}>
              <span style={{ transitionDelay: "0.9s" }}>Before</span>
            </span>
          </span>
          {HEADLINE.map((text, i) => (
            <span key={text} className={styles.line}>
              <span style={{ transitionDelay: `${1.05 + i * 0.12}s` }}>{text}</span>
            </span>
          ))}
        </h1>
      </section>

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

function ReturnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 4v8a3 3 0 0 0 3 3h10M15 11l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
