import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Lora, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "eyewee",
  description:
    "You say it — eyewee carries it, guides it, and cracks the toughest problems. The AI companion for postdocs navigating a new country, a new lab, and an unsolved project.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${plexSans.variable}`}>{children}</body>
    </html>
  );
}
