import type { Metadata } from "next";
import { Geist_Mono, Inter_Tight, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const sans = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const deva = Noto_Sans_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  weight: ["400", "500"],
});

const INTRO_FLAG = `if (location.pathname === "/" && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.dataset.intro = "pending";`;

export const metadata: Metadata = {
  title: "Bhaada | Trucks booked by phone, in Hindi",
  description:
    "Bhaada calls your truck owners in Hindi, bargains within your budget and books the cheapest truck. Built on Bolna.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${deva.variable}`} suppressHydrationWarning>
      <head>
        {/* Hide the hero before first paint so the preloader can draw it in. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_FLAG }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
