import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Prompt Foundry | Multi-provider prompt generator",
  description: "Publieke webapp om prompt-runs gebruiksvriendelijk te draaien, uit te leggen en directe output te genereren voor OpenAI, Claude en Gemini."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${display.variable} ${body.variable}`}>
      <body className="font-[var(--font-body)]">
        <AppHeader />
        <main>{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
