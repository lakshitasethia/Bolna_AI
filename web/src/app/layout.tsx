import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: "500",
});

const sans = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ruko — Call before you pay",
  description:
    "Ruko is a voice AI that stops phone scams. Before you pay anyone who called you, call Ruko — in Hindi, Hinglish and your language.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
