import Link from "next/link";
import LiveLoad from "../LiveLoad";
import { Arrow } from "../Nav";
import styles from "./Products.module.css";

function Chat({ lines }: { lines: { who: "agent" | "owner" | "note"; text: string }[] }) {
  return (
    <ul className={styles.chat}>
      {lines.map((l) => (
        <li key={l.text} data-who={l.who}>
          {l.who !== "note" && <span className="mono">{l.who === "agent" ? "Bhaada" : "Owner"}</span>}
          {l.text}
        </li>
      ))}
    </ul>
  );
}

const ROWS = [
  {
    title: "Phone-in booking",
    body: "Call Bhaada and say the load. Six agents ring your owners at once, share every rate they lock, and book the cheapest truck. You watch it happen on the desk.",
    link: { href: "/desk", label: "Open the desk" },
    visual: <LiveLoad />,
  },
  {
    title: "Check calls",
    body: "At pickup time Bhaada calls the driver, asks whether the truck is loaded and where it has reached, and puts the answer on your desk.",
    link: { href: "/desk", label: "Try a load" },
    visual: (
      <Chat
        lines={[
          { who: "agent", text: "Suresh ji, gaadi load ho gayi? Abhi kahan pahunche?" },
          { who: "owner", text: "Haan, 6:40 pe load hui. Abhi Neemrana cross kiya." },
          { who: "agent", text: "Theek hai. Jaipur kab tak?" },
          { who: "owner", text: "Dopahar 1 baje tak." },
          { who: "note", text: "Sent to shipper: loaded 6:40 am, past Neemrana, ETA 1 pm" },
        ]}
      />
    ),
  },
  {
    title: "Return loads",
    body: "When a truck is empty in Jaipur, the owner calls Bhaada and says so in Hindi. Bhaada matches it to your open loads going back.",
    link: { href: "/desk", label: "Try a load" },
    visual: (
      <Chat
        lines={[
          { who: "owner", text: "Jaipur mein khaali hoon, Delhi wapas jaana hai." },
          { who: "agent", text: "Kal subah Sitapura se Okhla ka load hai, 18 ton. ₹31,000 chalega?" },
          { who: "owner", text: "Chalega." },
          { who: "note", text: "Return load matched in one call" },
        ]}
      />
    ),
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
