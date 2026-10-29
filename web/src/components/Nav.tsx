import Link from "next/link";
import styles from "./Nav.module.css";

export function Wordmark() {
  return (
    <Link href="/" className={styles.wordmark} aria-label="Bhaada home">
      <span className={styles.latin}>bhaada</span>
      <span className={styles.deva} lang="hi">
        भाड़ा
      </span>
    </Link>
  );
}

export default function Nav({ cta = true }: { cta?: boolean }) {
  return (
    <header className={styles.bar}>
      <Wordmark />
      <nav className={styles.links} aria-label="Main">
        <Link href="/#how">How it works</Link>
        <Link href="/#why">Why now</Link>
      </nav>
      {cta && (
        <Link href="/desk" className={styles.cta}>
          Post a load
        </Link>
      )}
    </header>
  );
}
