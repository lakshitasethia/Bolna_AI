"use client";

import Link from "next/link";
import { type RefObject, useEffect, useRef } from "react";
import { Arrow } from "../Nav";
import { LogoMark, RoadScene } from "./art";
import { gsap, MOTION } from "./motion";
import styles from "./Closing.module.css";

const SOURCES = [
  { href: "https://eng.blackbuck.com/bhai-load-hai-kya/", label: "BlackBuck" },
  {
    href: "https://deccanherald.com/business/indian-truckers-caught-on-a-pot-holed-road-to-growth-aspirations-1218737.html",
    label: "NITI Aayog via Deccan Herald",
  },
  { href: "https://forkast.news/happyrobot-wants-1-2-billion-to-run-your-freight-by-voice/", label: "Forkast" },
];

const NS = "http://www.w3.org/2000/svg";
const WORD = {
  x: 700,
  y: 262,
  textAnchor: "middle",
  textLength: 1340,
  lengthAdjust: "spacingAndGlyphs",
  className: "svg-sans",
  fontSize: 290,
  fontWeight: 500,
  letterSpacing: -6,
} as const;

// Ink spreads under the cursor and fills the outlined letters, then dries away.
function useInk(svgRef: RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const svg = svgRef.current!;
    const core = svg.querySelector<SVGGElement>("[data-ink='core']")!;
    const halo = svg.querySelector<SVGGElement>("[data-ink='halo']")!;
    let last: DOMPoint | null = null;

    const blot = (layer: SVGGElement, x: number, y: number, r: number, hold: number) => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
      c.setAttribute("r", "0");
      c.setAttribute("fill", "#fff");
      layer.appendChild(c);
      gsap
        .timeline({ onComplete: () => c.remove() })
        .to(c, { attr: { r }, duration: 0.5, ease: "expo.out" })
        .to(c, { attr: { r: 0 }, duration: 1.1, ease: "power2.in" }, hold);
    };

    const stamp = (x: number, y: number) => {
      const r = gsap.utils.random(34, 58);
      blot(halo, x, y, r * 1.28, 1.15);
      blot(core, x, y, r, 1.05);
      if (Math.random() < 0.4) {
        const a = Math.random() * Math.PI * 2;
        const d = r * gsap.utils.random(1.1, 1.6);
        const s = r * gsap.utils.random(0.14, 0.3);
        blot(halo, x + Math.cos(a) * d, y + Math.sin(a) * d, s * 1.4, 0.9);
        blot(core, x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0.8);
      }
    };

    const onMove = (e: PointerEvent) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      if (!last) {
        stamp(pt.x, pt.y);
        last = pt;
        return;
      }
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist < 22) return;
      const steps = Math.min(8, Math.floor(dist / 22));
      for (let i = 1; i <= steps; i++) {
        stamp(last.x + ((pt.x - last.x) * i) / steps, last.y + ((pt.y - last.y) * i) / steps);
      }
      last = pt;
    };
    const onLeave = () => {
      last = null;
    };

    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerleave", onLeave);
    return () => {
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(svg.querySelectorAll("[data-ink] circle"));
    };
  }, [svgRef]);
}

export default function Closing() {
  const root = useRef<HTMLDivElement>(null);
  const word = useRef<SVGSVGElement>(null);
  useInk(word);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap.from("[data-road] [data-draw]", {
          drawSVG: "0%",
          duration: 1.6,
          stagger: 0.03,
          ease: "power2.inOut",
          scrollTrigger: { trigger: "[data-road]", start: "top 80%" },
        });
        gsap.from("[data-road] [data-tone]", {
          opacity: 0,
          duration: 1,
          stagger: 0.05,
          scrollTrigger: { trigger: "[data-road]", start: "top 65%" },
        });
        const outline = root.current!.querySelector<SVGTextElement>("[data-word]")!;
        gsap.fromTo(
          outline,
          { strokeDashoffset: 2600 },
          { strokeDashoffset: 0, duration: 3, ease: "power2.inOut", scrollTrigger: { trigger: outline, start: "top 92%" } },
        );
        gsap.from("[data-guide]", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.4,
          stagger: 0.12,
          ease: "expo.inOut",
          scrollTrigger: { trigger: outline, start: "top 92%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <section className={styles.cta} aria-labelledby="cta-title">
        <span className={`${styles.coord} mono`} data-pos="tl">
          [28.53° N, 77.27° E]
        </span>
        <span className={`${styles.coord} mono`} data-pos="tr">
          [NH 48]
        </span>
        <span className={`${styles.coord} mono`} data-pos="bl">
          [268 KM]
        </span>
        <span className={`${styles.coord} mono`} data-pos="br">
          [26.91° N, 75.79° E]
        </span>
        <h2 id="cta-title" className={styles.title} data-lines>
          See Bhaada book a truck on your lane
        </h2>
        <p className={styles.sub}>
          Post a load and watch Bhaada call owners. Simulated owners work right away. Real calls switch on once Bolna is
          connected.
        </p>
        <Link href="/desk" className={`${styles.btn} mono`}>
          <span>Post a load</span>
          <i>
            <Arrow />
          </i>
        </Link>
        <div className={styles.road} data-road>
          <RoadScene />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.grid}>
          <p className={styles.tagline}>A voice agent that books your trucks in Hindi</p>
          <div className={styles.col}>
            <p className="mono">Product</p>
            <Link href="/desk">Booking desk</Link>
            <Link href="/#route">How it works</Link>
            <Link href="/#why">Why Bhaada</Link>
          </div>
          <div className={styles.col}>
            <p className="mono">Why now</p>
            <span>About 15 lakh truck owners in India, most with one to three trucks.</span>
            <span>In the US, HappyRobot&apos;s voice agents do this job for 8 of the 10 largest brokers.</span>
          </div>
          <div className={styles.col}>
            <p className="mono">Sources</p>
            {SOURCES.map((s) => (
              <a key={s.href} href={s.href}>
                {s.label}
              </a>
            ))}
          </div>
          <div className={styles.mark}>
            <LogoMark size={150} />
          </div>
          <div className={styles.col}>
            <p className="mono">Made for</p>
            <span>Bolna x Symphony Buildathon, 2026</span>
          </div>
          <div className={styles.col}>
            <p className="mono">Built on</p>
            <a href="https://www.bolna.ai/">Bolna voice AI</a>
          </div>
          <div className={styles.col}>
            <p className="mono">Languages</p>
            <span>Hindi, Hinglish, English</span>
          </div>
          <div className={styles.col}>
            <p className="mono">Demo lane</p>
            <span>Okhla, Delhi to Jaipur on NH 48</span>
          </div>
        </div>

        <div className={styles.word} aria-hidden>
          <svg ref={word} viewBox="0 0 1400 300" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="ink-edge-core" filterUnits="userSpaceOnUse" x="0" y="0" width="1400" height="300">
                <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" />
                <feDisplacementMap in="SourceGraphic" scale="46" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="ink-edge-halo" filterUnits="userSpaceOnUse" x="0" y="0" width="1400" height="300">
                <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="21" />
                <feDisplacementMap in="SourceGraphic" scale="40" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <mask id="ink-core" maskUnits="userSpaceOnUse" x="0" y="0" width="1400" height="300">
                <g filter="url(#ink-edge-core)" data-ink="core" />
              </mask>
              <mask id="ink-halo" maskUnits="userSpaceOnUse" x="0" y="0" width="1400" height="300">
                <g filter="url(#ink-edge-halo)" data-ink="halo" />
              </mask>
            </defs>
            <g stroke="var(--line)" strokeWidth="1">
              <line x1="0" y1="52" x2="1400" y2="52" data-guide />
              <line x1="0" y1="262" x2="1400" y2="262" data-guide />
              <line x1="0" y1="157" x2="1400" y2="157" strokeDasharray="3 5" data-guide />
            </g>
            <text {...WORD} style={{ fill: "#cfcec8" }} mask="url(#ink-halo)">
              BHAADA
            </text>
            <text {...WORD} style={{ fill: "var(--ink)" }} mask="url(#ink-core)">
              BHAADA
            </text>
            <text
              {...WORD}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.1"
              strokeDasharray="2600"
              data-word
            >
              BHAADA
            </text>
            {[115, 345, 575, 815, 1045, 1285].map((x) => (
              <circle key={x} cx={x} cy="157" r="2" fill="var(--ink)" />
            ))}
          </svg>
        </div>

        <div className={`${styles.legal} mono`}>
          <span>©2026 Bhaada. All rights reserved.</span>
          <span>
            Made for the Bolna x Symphony Buildathon <span lang="hi">भाड़ा</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
