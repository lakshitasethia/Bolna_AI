"use client";

import { useEffect, useRef } from "react";
import { Arrow } from "../Nav";
import { IsoChats, IsoEmpty, IsoPhone, IsoRadar, TowerScene } from "./art";
import { gsap, MOTION, prefersReduced, SplitText } from "./motion";
import styles from "./Problems.module.css";

const LANGS = [
  { text: "हिंदी", deva: true },
  { text: "Any phone" },
  { text: "No app" },
];

const PROBLEMS = [
  {
    tag: "Manual",
    title: "Every truck is thirty calls",
    body: "You ring owner after owner, ask the same five questions and write rates on a notepad.",
    Icon: IsoPhone,
  },
  {
    tag: "Scattered",
    title: "Rates live in WhatsApp groups",
    body: "Quotes arrive as voice notes and forwards, so you never see the whole market at once.",
    Icon: IsoChats,
  },
  {
    tag: "Blind",
    title: "Nobody calls to check the truck",
    body: "Once the truck leaves, you hear about delays only when the shipper calls you.",
    Icon: IsoRadar,
  },
  {
    tag: "Empty",
    title: "Trucks come home empty",
    body: "An empty truck in Jaipur and your load going back to Delhi never find each other.",
    Icon: IsoEmpty,
  },
];

// Heron swaps the cursor for a small orange square over each drawing.
function follow(e: React.PointerEvent<HTMLElement>) {
  const area = e.currentTarget;
  const dot = area.querySelector<HTMLElement>("[data-cursor]")!;
  const r = area.getBoundingClientRect();
  dot.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
}

// On hover the icon redraws line by line, then its dashed guides fade in and start to flow.
function redraw(card: HTMLElement) {
  if (prefersReduced()) return;
  const solid = card.querySelectorAll("svg path:not([stroke-dasharray])");
  const dashed = card.querySelectorAll("svg path[stroke-dasharray]");
  const filled = card.querySelectorAll("svg path[fill]:not([fill='none'])");
  const drawn = 0.7 + solid.length * 0.09;
  gsap.killTweensOf([solid, dashed, filled]);
  gsap.fromTo(solid, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7, stagger: 0.09, ease: "power2.inOut" });
  gsap.fromTo(filled, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.3, delay: drawn - 0.3 });
  gsap.fromTo(dashed, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.in", delay: 0.25 + solid.length * 0.09 });
}

export default function Problems() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        const words = new SplitText("[data-scrub]", { type: "words" }).words;
        gsap.fromTo(
          words,
          { color: "#b4b4b0" },
          {
            color: "#282828",
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: "[data-scrub]", start: "top 78%", end: "bottom 42%", scrub: true },
          },
        );
        gsap.from("[data-tower] [data-draw]", {
          drawSVG: "0%",
          duration: 1.6,
          stagger: 0.02,
          ease: "power2.inOut",
          scrollTrigger: { trigger: "[data-tower]", start: "top 75%" },
        });
        gsap.from("[data-tower] [data-tone]", {
          opacity: 0,
          duration: 1,
          delay: 0.8,
          scrollTrigger: { trigger: "[data-tower]", start: "top 75%" },
        });

        // Colour pours down through the black-and-white print from the top as you scroll.
        const read = root.current!.querySelector<HTMLElement>("[data-signal]")!;
        const signal = { v: 0 };
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: "[data-tower]", start: "top 65%", end: "bottom 70%", scrub: 0.8 },
          })
          .fromTo("[data-colour]", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0)
          .fromTo("[data-tscan]", { top: "0%", autoAlpha: 1 }, { top: "100%", duration: 1 }, 0)
          .to(signal, { v: 100, duration: 1, onUpdate: () => void (read.textContent = `Signal ${Math.round(signal.v)}%`) }, 0)
          .fromTo("[data-colour] [data-sun]", { scale: 0.86, svgOrigin: "262 196" }, { scale: 1, duration: 1 }, 0)
          .to("[data-tscan]", { autoAlpha: 0, duration: 0.06 }, 0.97);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="statement" className={styles.section}>
      <div className={styles.statement}>
        <div className={styles.tower} data-tower>
          <div className={styles.towerArt}>
            <TowerScene id="tower-bw" />
            <div className={styles.colour} data-colour aria-hidden>
              <TowerScene id="tower-c" colour />
            </div>
            <div className={styles.tscan} data-tscan aria-hidden>
              <span className="mono" data-signal>
                Signal 100%
              </span>
            </div>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.copy}>
            <p className={styles.scrub} data-scrub>
              Thirty phone calls for one truck shouldn&apos;t eat your morning. Make one call to Bhaada. Six agents
              ring your owners at once, bargain in Hindi against each other&apos;s rates and hand you the cheapest truck.
            </p>
            <a href="#route" className={`${styles.btn} mono`}>
              <span>See how</span>
              <i>
                <Arrow />
              </i>
            </a>
          </div>
          <div className={styles.langs}>
            <p className={`${styles.langHead} mono`}>Speaks the way owners speak</p>
            <ul>
              {LANGS.map((l) => (
                <li key={l.text} lang={l.deva ? "hi" : undefined} data-deva={l.deva}>
                  {l.text}
                </li>
              ))}
            </ul>
            <p className={`${styles.langFoot} mono`}>
              Works on the phone the owner already has. No app, no smartphone, no sign-up.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.head}>
        <div>
          <p className={`${styles.label} mono`} data-scramble>
            Problems
          </p>
          <h2 className={styles.h2} data-lines>
            Your phone is your dispatch software, and it can&apos;t dial itself
          </h2>
        </div>
        <p className={styles.desc}>
          Trucks are found the way they were twenty years ago: by phone, by WhatsApp and through brokers you know. India
          has about 15 lakh truck owners and most run one to three trucks, so every load means calling around.
        </p>
      </div>

      <ol className={styles.cards}>
        {PROBLEMS.map(({ tag, title, body, Icon }, i) => (
          <li key={tag} className={styles.card} data-problem onMouseEnter={(e) => redraw(e.currentTarget)}>
            <div className={`${styles.cardTop} mono`}>
              <i className={styles.dot} />
              <span className={styles.tag}>{tag}</span>
              <span>[0{i + 1}]</span>
            </div>
            <div className={styles.icon} onPointerMove={follow}>
              <i className={styles.cursor} data-cursor aria-hidden />
              <i className={styles.corner} data-c="tl" />
              <i className={styles.corner} data-c="tr" />
              <i className={styles.corner} data-c="bl" />
              <i className={styles.corner} data-c="br" />
              <div className={styles.iconArt}>
                <Icon />
              </div>
            </div>
            <div className={styles.cardText}>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardBody}>{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
