"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "./landing/art";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "/#route", label: "How it works" },
  { href: "/#why", label: "Why Bhaada" },
  { href: "/#for", label: "Who it's for" },
  { href: "/desk", label: "Booking desk" },
];

export function Wordmark() {
  return (
    <Link href="/" className={styles.wordmark} aria-label="Bhaada home">
      <LogoMark size={34} />
      <span>BHAADA</span>
    </Link>
  );
}

function Arrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d="M0 5H12.5M8.5 1L12.5 5L8.5 9" />
    </svg>
  );
}

export default function Nav({ cta = true }: { cta?: boolean }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={styles.bar} data-hidden={hidden} data-intro-hide data-nav-bar>
      <Wordmark />
      <nav className={styles.links} aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`${styles.cell} mono`} data-nav-link>
            <span>{l.label}</span>
          </Link>
        ))}
        {cta && (
          <Link href="/desk" className={`${styles.cell} ${styles.cta} mono`} data-nav-link>
            <span>Post a load</span>
            <Arrow />
          </Link>
        )}
      </nav>
    </header>
  );
}

export { Arrow };
