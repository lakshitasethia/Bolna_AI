"use client";

import { useEffect, useRef, useState } from "react";
import { OWNERS, RouteMap } from "./art";
import { DESKTOP, gsap, SplitText } from "./motion";
import styles from "./RouteScene.module.css";

const STEPS = [
  "A transporter in Okhla needs a 32 ft truck to Jaipur by 6 am. Normally that's a morning of calls, one owner at a time.",
  "With Bhaada they make one call, in Hindi, and say the load. Six agents start ringing six owners in the same minute.",
  "When one owner agrees, that agent tells the other five. They only book below that rate, and the cheapest truck wins.",
];

const CARDS: Record<(typeof OWNERS)[number]["id"], { code: string; title: string; body: string; side: "l" | "r" }> = {
  raju: { code: "AGENT A", title: "Raju Yadav, Okhla", body: "Agreed first at ₹37,000. Agent A told the other five to beat it.", side: "l" },
  gurpreet: { code: "AGENT B", title: "Gurpreet Singh, Kundli", body: "Asked ₹39,000. Beat Raju at ₹36,000, kept as backup.", side: "l" },
  anwar: { code: "AGENT C", title: "Anwar Khan, Gurugram", body: "Truck is in Ludhiana until parso. Noted for next time.", side: "r" },
  check: { code: "BOOKED", title: "Mohan Lal, Ghaziabad", body: "Heard a truck was ready at ₹36,000. Took ₹35,500.", side: "r" },
};

const FEATURES = [
  "One agent per owner, all at once.",
  "Each locked rate goes to every agent.",
  "Never goes past your maximum.",
  "Books the cheapest, releases the rest.",
];

export default function RouteScene() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const finalRef = useRef(false);

  useEffect(() => {
    const el = root.current!;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(DESKTOP, () => {
        el.dataset.pinned = "true";
        const a = new SplitText("[data-head-a]", { type: "chars" });
        const b = new SplitText("[data-head-b]", { type: "chars" });
        const route = el.querySelector<SVGPathElement>("[data-route]")!;
        const truck = el.querySelector<SVGRectElement>("[data-truck]")!;
        const len = route.getTotalLength();
        const ride = { t: 0 };
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]");

        gsap.set([a.chars, b.chars], { opacity: 0 });
        const walls = "path[data-wall], [data-wall] path";
        const streets = "[data-street] path";
        gsap.set([walls, streets].join(","), { drawSVG: "0%" });
        gsap.set("[data-labels], [data-dims], [data-faint]", { opacity: 0 });
        gsap.set("[data-owner]", { scale: 0, transformOrigin: "50% 50%", transformBox: "fill-box" });
        gsap.set("[data-intro-box]", { autoAlpha: 0, y: 20 });
        gsap.set(steps.slice(1), { autoAlpha: 0, y: 12 });
        gsap.set("[data-map]", { xPercent: -44, yPercent: -50 });
        gsap.set("[data-panel]", { autoAlpha: 0, x: 60, yPercent: -50 });
        gsap.set("[data-panel] li", { autoAlpha: 0, y: 10 });
        gsap.set("[data-dot]", { autoAlpha: 0 });

        const swap = (from: number, to: number) =>
          gsap
            .timeline()
            .to(steps[from], { autoAlpha: 0, y: -12, duration: 0.3 })
            .to(steps[to], { autoAlpha: 1, y: 0, duration: 0.3 }, "<0.15");

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=520%",
            pin: "[data-pin]",
            scrub: 1,
            onUpdate: (st) => {
              const isFinal = st.progress > 0.86;
              if (isFinal !== finalRef.current) {
                finalRef.current = isFinal;
                setFinal(isFinal);
              }
            },
          },
        });

        tl.to("[data-dot]", { autoAlpha: 1, duration: 0.1 }, 0)
          .to(a.chars, { opacity: 1, stagger: 0.04, duration: 0.2 }, 0)
          .fromTo("[data-dot]", { left: "0%" }, { left: "100%", duration: 1 }, 0)
          .to("[data-dot]", { autoAlpha: 0, duration: 0.1 }, 1)
          .to(a.chars, { color: "#b4b4b0", stagger: 0.02, duration: 0.2 }, 1.05)
          .to(a.chars, { opacity: 0, stagger: 0.02, duration: 0.2 }, 1.5)
          .to(b.chars, { opacity: 1, stagger: 0.03, duration: 0.2 }, 1.9)
          .to(b.chars, { color: "#b4b4b0", stagger: 0.02, duration: 0.2 }, 2.6)
          .to(b.chars, { opacity: 0, stagger: 0.015, duration: 0.15 }, 2.95)
          .to(walls, { drawSVG: "100%", duration: 1.4, stagger: 0.15, ease: "power1.inOut" }, 3.0)
          .to("[data-intro-box]", { autoAlpha: 1, y: 0, duration: 0.3 }, 3.1)
          .to(streets, { drawSVG: "100%", duration: 1, stagger: 0.1 }, 4.2)
          .to("[data-labels], [data-faint]", { opacity: 1, duration: 0.5 }, 4.6)
          .add(swap(0, 1), 4.5)
          .to("[data-dims]", { opacity: 1, duration: 0.5 }, 5.4)
          .to("[data-owner]", { scale: 1, duration: 0.35, stagger: 0.15, ease: "back.out(2)" }, 5.5)
          .add(swap(1, 2), 5.9)
          .to("[data-map]", { xPercent: -79, scale: 0.74, duration: 1, ease: "power2.inOut" }, 6.8)
          .to("[data-intro-box]", { autoAlpha: 0, y: 20, duration: 0.4 }, 6.8)
          .to("[data-panel]", { autoAlpha: 1, x: 0, duration: 0.8, ease: "power2.out" }, 7.1)
          .to("[data-panel] li", { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.3 }, 7.4)
          .to(truck, { opacity: 1, duration: 0.1 }, 7.3)
          .to(
            ride,
            {
              t: 1,
              duration: 1.6,
              ease: "power1.inOut",
              onUpdate: () => {
                const p = route.getPointAtLength(ride.t * len);
                truck.setAttribute("transform", `translate(${p.x} ${p.y})`);
              },
            },
            7.3,
          );

        return () => {
          delete el.dataset.pinned;
          finalRef.current = false;
          setFinal(false);
        };
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const shown = active ?? (final ? "gurpreet" : null);

  return (
    <section ref={root} id="route" className={styles.section} aria-labelledby="route-title">
      <div className={styles.pin} data-pin>
        <i className="plus" data-corner="tl" />
        <i className="plus" data-corner="tr" />
        <i className="plus" data-corner="bl" />
        <i className="plus" data-corner="br" />

        <p className={styles.headA} aria-hidden>
          <span data-head-a>Six lines, one price</span>
          <i className={styles.dot} data-dot />
        </p>
        <h2 id="route-title" className={styles.headB} data-head-b>
          Every agent hears every deal
        </h2>

        <div className={styles.map} data-map>
          <RouteMap />
          {OWNERS.map((o) => {
            const c = CARDS[o.id];
            return (
              <div
                key={o.id}
                className={styles.owner}
                style={{ left: `${(o.x / 1000) * 100}%`, top: `${(o.y / 720) * 100}%` }}
                data-side={c.side}
                data-open={shown === o.id}
              >
                <button
                  type="button"
                  className={styles.hit}
                  aria-label={`${c.code}: ${c.title}`}
                  aria-expanded={shown === o.id}
                  onMouseEnter={() => setActive(o.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(o.id)}
                  onBlur={() => setActive(null)}
                />
                <div className={styles.card}>
                  <span className={`${styles.code} mono`} data-booked={o.id === "check"}>
                    {c.code}
                  </span>
                  <strong>{c.title}</strong>
                  <span>{c.body}</span>
                </div>
              </div>
            );
          })}
        </div>

        <aside className={styles.introBox} data-intro-box>
          <p className={`${styles.introHead} mono`}>The morning</p>
          <div className={styles.introSteps}>
            {STEPS.map((s) => (
              <p key={s} data-step>
                {s}
              </p>
            ))}
          </div>
          <p className={`${styles.introFoot} mono`}>{final ? "[Hover an owner]" : "[Scroll to continue]"}</p>
        </aside>

        <div className={styles.panel} data-panel>
          <p className={`${styles.panelLabel} mono`}>Your owners. Your rates. One desk.</p>
          <h3 className={styles.panelTitle}>A live auction across your owner network</h3>
          <p className={styles.panelBody}>
            Every agent works to the same board. The moment one owner agrees, the rest can only take a lower rate, and
            they can tell their owner that a truck is already lined up at that price. It&apos;s always a real price,
            never a bluff, and every rupee is checked by our server, not left to the voice model.
          </p>
          <ul className={styles.features}>
            {FEATURES.map((f, i) => (
              <li key={f}>
                <span>{f}</span>
                <i className="mono">[0{i + 1}]</i>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
