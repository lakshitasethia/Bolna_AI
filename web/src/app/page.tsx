import Link from "next/link";
import HowItWorks from "@/components/HowItWorks";
import LiveLoad from "@/components/LiveLoad";
import Nav, { Wordmark } from "@/components/Nav";
import TruckArt from "@/components/TruckArt";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <p className={styles.pill}>
              <span>Built on Bolna</span> Hindi and Hinglish, on any phone
            </p>
            <h1 className={styles.h1}>Book a truck in three minutes, not thirty phone calls.</h1>
            <p className={styles.lede}>
              Bhaada calls your truck owners in Hindi, bargains within your budget and books the cheapest truck. Owners
              don&apos;t install anything. They just pick up.
            </p>
            <Link href="/desk" className={styles.primary}>
              Post a load
            </Link>
            <p className={styles.small}>Try it with simulated owners, or connect Bolna for real calls.</p>
          </div>

          <div className={styles.collage}>
            <TruckArt className={styles.art} />
            <div className={styles.road} aria-hidden />
            <div className={styles.windowWrap}>
              <LiveLoad />
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className={styles.band} id="why" aria-labelledby="why-title">
          <div className={styles.bandInner}>
            <p className={styles.quote} id="why-title">
              “Bhai, Delhi–Jaipur, 32 foot, kal subah, gaadi hai?”
            </p>
            <p className={styles.bandBody}>
              Transporters ask this all day, one call at a time. India has about 15 lakh truck owners, and most of them
              run one to three trucks. They find loads through phone calls, WhatsApp groups and brokers they know.
            </p>
            <p className={styles.bandBody}>
              In the US, this exact job is a $1.2 billion company: HappyRobot&apos;s voice agents book freight for 8 of
              the 10 largest brokers. Nobody does it in Hindi yet.
            </p>
            <p className={styles.sources}>
              Sources:{" "}
              <a href="https://eng.blackbuck.com/bhai-load-hai-kya/">BlackBuck</a>,{" "}
              <a href="https://deccanherald.com/business/indian-truckers-caught-on-a-pot-holed-road-to-growth-aspirations-1218737.html">
                NITI Aayog via Deccan Herald
              </a>
              , <a href="https://forkast.news/happyrobot-wants-1-2-billion-to-run-your-freight-by-voice/">Forkast</a>
            </p>
          </div>
        </section>

        <section className={styles.closing}>
          <h2 className={styles.h2}>Your next load is one call away.</h2>
          <Link href="/desk" className={styles.primary}>
            Post a load
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <Wordmark />
        <p>Made for the Bolna x Symphony Buildathon, 2026.</p>
      </footer>
    </>
  );
}
