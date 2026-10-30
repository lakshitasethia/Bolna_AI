"use client";

import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, ScrambleTextPlugin);
}

export { gsap, ScrollTrigger, SplitText };

// Pinned, scrubbed scenes only run on wide screens with motion allowed.
export const DESKTOP = "(min-width: 960px) and (prefers-reduced-motion: no-preference)";
export const MOTION = "(prefers-reduced-motion: no-preference)";

export const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The Lenis instance lives here so any section can pause or drive the scroll.
export const scroller: { lenis: Lenis | null } = { lenis: null };

export const INTRO_DONE = "bhaada:intro-done";

export function scramble(el: Element, text = el.textContent ?? "", duration = 0.9) {
  return gsap.to(el, { duration, scrambleText: { text, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", speed: 0.6 } });
}
