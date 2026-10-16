import type { Metadata } from "next";
import { Fredoka, Huninn } from "next/font/google";
import "./globals.css";

const huninn = Huninn({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-huninn",
  display: "swap",
  // Next.js ships no fallback metrics for Huninn; the fallback stack lives in globals.css.
  adjustFontFallback: false,
});

const fredoka = Fredoka({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KouKou 扣扣帳本",
  description: "把每一筆定期扣款整理在同一個地方",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
};

/**
 * Root layout shared by every page.
 *
 * @param props.children - The active route's content.
 * @returns The HTML document shell.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW" className={`${huninn.variable} ${fredoka.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
