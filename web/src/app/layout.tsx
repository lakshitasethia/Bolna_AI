import type { Metadata } from "next";
import { Hanken_Grotesk, Tiro_Devanagari_Hindi, Young_Serif } from "next/font/google";
import "./globals.css";

const serif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
});

const sans = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const deva = Tiro_Devanagari_Hindi({
  variable: "--font-tiro-deva",
  subsets: ["devanagari"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Bhaada · Trucks booked by phone, in Hindi",
  description:
    "Bhaada calls your truck owners in Hindi, bargains within your budget and books the cheapest truck. Built on Bolna.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${deva.variable}`}>
      <body>{children}</body>
    </html>
  );
}
