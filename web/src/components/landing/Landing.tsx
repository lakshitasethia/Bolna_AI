"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import Nav from "../Nav";
import Closing from "./Closing";
import Hero from "./Hero";
import { gsap, INTRO_DONE, MOTION, prefersReduced, scramble, scroller, ScrollTrigger, SplitText } from "./motion";
import Problems from "./Problems";
import Products from "./Products";
import RouteScene from "./RouteScene";
import Steps from "./Steps";
import UseCases from "./UseCases";
import styles from "./Landing.module.css";

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);

  // Lenis drives the scroll; ScrollTrigger reads from it on every frame.
  useEffect(() => {
    if (prefersReduced()) return;
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: 0 } });
    scroller.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    if (document.documentElement.dataset.intro === "pending") lenis.stop();
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      scroller.lenis = null;
    };
  }, []);

  // Shared reveals: headings rise out of a mask, mono labels scramble in.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
          const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "line-mask" });
          gsap.from(split.lines, {
            yPercent: 105,
            duration: 1.1,
            stagger: 0.09,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-scramble]").forEach((el) => {
          const text = el.textContent ?? "";
          ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => void scramble(el, text) });
        });
      });
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener(INTRO_DONE, refresh);
    return () => {
      window.removeEventListener(INTRO_DONE, refresh);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className={styles.shell}>
      <Nav />
      <main>
        <Hero />
        <Problems />
        <RouteScene />
        <Products />
        <Steps />
        <UseCases />
      </main>
      <Closing />
    </div>
  );
}
