import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Норма",
    template: "%s · Норма",
  },
  description: "Готовые рационы на день и на неделю с доставкой по Москве.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${sans.variable} ${display.variable} h-full antialiased`} lang="ru">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
