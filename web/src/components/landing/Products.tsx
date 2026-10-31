import Link from "next/link";
import LiveLoad from "../LiveLoad";
import { Arrow } from "../Nav";
import styles from "./Products.module.css";

const ROWS = [
  {
    title: "Phone-in booking",
    body: "Call Bhaada and say the load. Six agents ring your owners at once, share every rate they lock, and book the cheapest truck. You watch it happen on the desk.",
    link: { href: "/desk", label: "Open the desk" },
    visual: <LiveLoad />,
  },
];

export default function Products() {
  return (
    <section className={styles.section} aria-label="What Bhaada does">
      {ROWS.map((r, i) => (
        <article key={r.title} className={styles.row}>
          <div className={styles.name}>
            <span className="mono">[0{i + 1}]</span>
            <h3 data-lines>{r.title}</h3>
          </div>
          <div className={styles.visual}>{r.visual}</div>
          <div className={styles.side}>
            <p>{r.body}</p>
            <Link href={r.link.href} className={`${styles.link} mono`}>
              <span>{r.link.label}</span>
              <Arrow />
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
