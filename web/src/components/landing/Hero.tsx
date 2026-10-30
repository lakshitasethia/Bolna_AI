"use client";

import { useEffect, useRef, useState } from "react";
import { Arrow } from "../Nav";
import { TruckScene } from "./art";
import { gsap, INTRO_DONE, prefersReduced, scramble, scroller, SplitText } from "./motion";
import styles from "./Hero.module.css";

// Marker positions in the TruckScene viewBox (-60 60 1380 410).
const VB = { x: -60, y: 60, w: 1380, h: 410 };
const TIPS = [
  { x: 285.5, y: 199.5, code: "AGENT F", title: "Mohan Lal, Ghaziabad", body: "Asked ₹41,000. Beat ₹36,000. Booked at ₹35,500." },
  { x: 831.5, y: 227.5, code: "LOAD 0417", title: "Okhla to Jaipur, 20 ton", body: "One call in, six agents out. Booked in 25 s." },
];
const pct = (v: number, o: number, s: number) => `${((v - o) / s) * 100}%`;

const LOG = [
  "001 Load owner list",
  "002 Warm up Hindi voice",
  "003 Set max rate ₹38,000",
  "004 Dial Raju Yadav",
  "005 Dial Gurpreet Singh",
  "006 Dial Anwar Khan",
  "007 Open at ₹35,000",
  "008 Counter in ₹500 steps",
  "009 Book cheapest truck",
  "010 Send confirmation",
];

const TAGS = ["Fewer calls", "Lower bhaada", "No app for owners", "Hindi and Hinglish", "Any phone"];

type Box = { x: number; y: number; w: number; h: number };

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [open, setOpen] = useState<boolean[]>([false, false]);
  const [dragged, setDragged] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = root.current!;
    const html = document.documentElement;
    const reduced = prefersReduced();

    const ctx = gsap.context(() => {
      const draws = gsap.utils.toArray<SVGElement>("[data-draw]", el);
      const tones = gsap.utils.toArray<SVGElement>("[data-tone]", el);
      const h1 = new SplitText("[data-hero-title]", { type: "lines", mask: "lines", linesClass: "line-mask" });
      const finish = () => {
        html.dataset.intro = "done";
        scroller.lenis?.start();
        setOpen([true, true]);
        window.dispatchEvent(new Event(INTRO_DONE));
      };

      if (reduced) {
        gsap.set("[data-preloader]", { autoAlpha: 0 });
        finish();
        return;
      }

      scroller.lenis?.stop();
      const counter = { v: 0 };
      const pctEl = el.querySelector("[data-pct]")!;
      gsap.set(draws, { drawSVG: "0%" });
      gsap.set(tones, { opacity: 0 });
      gsap.set("[data-hero-svg]", { visibility: "visible" });
      gsap.set(h1.lines, { yPercent: 105 });
      gsap.set("[data-log] li", { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.to(counter, {
        v: 100,
        duration: 2.8,
        ease: "power1.inOut",
        onUpdate: () => {
          pctEl.textContent = String(Math.round(counter.v));
        },
      })
        .to("[data-progress]", { scaleX: 1, duration: 2.8, ease: "power1.inOut" }, 0)
        .to(draws, { drawSVG: "100%", duration: 1.5, stagger: { amount: 1.3, from: "random" }, ease: "power1.inOut" }, 0.1)
        .from("[data-pre-title] span", { yPercent: 110, duration: 0.9, stagger: 0.08, ease: "expo.out" }, 0.25)
        .from("[data-pre-table] > *", { opacity: 0, duration: 0.4, stagger: 0.07 }, 0.5)
        .to("[data-log] li", { opacity: 1, duration: 0.05, stagger: 0.22 }, 0.6)
        .add(() => {
          el.querySelectorAll("[data-log] li").forEach((li, i) => gsap.delayedCall(i * 0.22, () => void scramble(li, li.textContent ?? "", 0.5)));
        }, 0.6)
        .to("[data-preloader]", { autoAlpha: 0, duration: 0.5 }, 3.0)
        .to(tones, { opacity: 1, duration: 0.9, stagger: { amount: 0.5, from: "random" } }, 3.0)
        .add(() => {
          html.dataset.intro = "done";
        }, 3.0)
        .from(document.querySelectorAll("[data-nav-bar] > a, [data-nav-link]"), { yPercent: -100, opacity: 0, duration: 0.9, stagger: 0.06, ease: "expo.out" }, 3.05)
        .from("[data-hero-ruler]", { scaleX: 0, duration: 1.1, ease: "expo.inOut", stagger: 0.1 }, 3.05)
        .to(h1.lines, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: "expo.out" }, 3.2)
        .from("[data-hero-fade]", { opacity: 0, y: 14, duration: 0.8, stagger: 0.1 }, 3.4)
        .add(finish, 3.6);
    }, el);

    return () => ctx.revert();
  }, []);

  // Crosshair, coordinates and drag-to-select over the drawing.
  const local = (e: React.PointerEvent) => {
    // Coordinates are relative to the wrapper; the canvas offset is kept for hit tests.
    const wrap = e.currentTarget.getBoundingClientRect();
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - wrap.left, y: e.clientY - wrap.top, ox: r.left - wrap.left, oy: r.top - wrap.top, w: r.width, h: r.height };
  };

  const hits = (b: Box, p: ReturnType<typeof local>) =>
    TIPS.map((t) => {
      const tx = p.ox + ((t.x - VB.x) / VB.w) * p.w;
      const ty = p.oy + ((t.y - VB.y) / VB.h) * p.h;
      return tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h;
    });

  const onMove = (e: React.PointerEvent) => {
    const p = local(e);
    setCursor({ x: p.x, y: p.y, cx: p.x - p.ox, cy: p.y - p.oy });
    if (drag.current) {
      const b = {
        x: Math.min(drag.current.x, p.x),
        y: Math.min(drag.current.y, p.y),
        w: Math.abs(p.x - drag.current.x),
        h: Math.abs(p.y - drag.current.y),
      };
      setBox(b);
      setOpen(hits(b, p));
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const p = local(e);
    drag.current = { x: p.x, y: p.y };
    setDragged(true);
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
    setOpen([false, false]);
  };

  const onUp = () => {
    drag.current = null;
    setBox(null);
  };

  return (
    <section ref={root} className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.stage}>
        <div className={styles.ruler} data-hero-ruler data-intro-hide>
          <i className="plus" />
          <i className="plus" />
        </div>

        <div
          className={styles.canvasWrap}
          onPointerMove={onMove}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={() => {
            setCursor(null);
            onUp();
          }}
        >
          <div ref={canvas} className={styles.canvas}>
            <div className={styles.svg} data-hero-svg>
              <TruckScene />
            </div>

            {TIPS.map((t, i) => (
              <div
                key={t.code}
                className={styles.tip}
                data-open={open[i]}
                data-side={i === 0 ? "right" : "left"}
                style={{ left: pct(t.x, VB.x, VB.w), top: pct(t.y, VB.y, VB.h) }}
              >
                <button
                  type="button"
                  className={styles.hit}
                  aria-label={`${t.code}: ${t.title}`}
                  aria-expanded={open[i]}
                  onMouseEnter={() => setOpen((o) => o.map((v, j) => (j === i ? true : v)))}
                  onFocus={() => setOpen((o) => o.map((v, j) => (j === i ? true : v)))}
                  onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))}
                />
                <div className={styles.card} role="status">
                  <span className={`${styles.code} mono`}>{t.code}</span>
                  <strong>{t.title}</strong>
                  <span>{t.body}</span>
                </div>
              </div>
            ))}
          </div>

          {cursor && (
            <div className={styles.cross} aria-hidden>
              <i className={styles.h} style={{ top: cursor.y }} />
              <i className={styles.v} style={{ left: cursor.x }} />
              <span className={`${styles.readout} mono`} style={{ left: cursor.x, top: cursor.y }}>
                <span>
                  X: {String(Math.max(0, Math.round(cursor.cx))).padStart(4, "0")} PX
                  <br />
                  Y: {String(Math.max(0, Math.round(cursor.cy))).padStart(4, "0")} PX
                </span>
                {!dragged && <span className={styles.hint}>Click and drag to see the calls</span>}
              </span>
            </div>
          )}
          {box && (
            <div
              className={styles.select}
              style={{
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
              }}
              aria-hidden
            />
          )}
        </div>

        <div className={styles.ruler} data-hero-ruler data-intro-hide>
          <i className="plus" />
          <i className="plus" />
        </div>
      </div>

      <div className={styles.intro} data-intro-hide>
        <h1 id="hero-title" className={styles.title} data-hero-title data-intro-hide>
          A voice agent that books your trucks in Hindi
        </h1>
        <div className={styles.lede}>
          <p data-hero-fade data-intro-hide>
            Bhaada phones your truck owners, bargains within your budget and books the cheapest truck. Owners don&apos;t
            install anything. They just pick up. Built on <a href="https://www.bolna.ai/">Bolna</a>.
          </p>
          <div className={styles.marquee} data-hero-fade data-intro-hide aria-hidden>
            <div className={styles.track}>
              {[...TAGS, ...TAGS, ...TAGS].map((t, i) => (
                <span key={i} className="mono">
                  <i />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <a href="#statement" className={`${styles.discover} mono`} data-hero-fade data-intro-hide>
          <span>Discover more</span>
          <Arrow />
        </a>
      </div>

      <div className={styles.preloader} data-preloader aria-hidden>
        <div className={styles.progress}>
          <span className={`${styles.pct} mono`}>
            <span data-pct>0</span>%
          </span>
          <i data-progress />
        </div>
        <p className={styles.preTitle} data-pre-title>
          <span>Voice agents,</span>
          <span>built on Bolna,</span>
          <span>for India&apos;s</span>
          <span>truck owners</span>
        </p>
        <div className={styles.preInfo}>
          <dl className={`${styles.table} mono`} data-pre-table>
            <dt className={styles.welcome}>Welcome to Bhaada</dt>
            <dt>Type</dt>
            <dd>Voice AI freight desk, end to end</dd>
            <dt>Founded</dt>
            <dd>2026</dd>
            <dt>Focus</dt>
            <dd>One call in, six agents out, in Hindi</dd>
            <dt>Lane</dt>
            <dd>Okhla, Delhi to Jaipur on NH 48</dd>
          </dl>
          <ol className={`${styles.log} mono`} data-log>
            {LOG.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
