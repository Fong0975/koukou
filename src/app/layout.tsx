import type { Metadata, Viewport } from "next";
import { Fredoka, Huninn } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME, THEME_COLOR } from "@/lib/constants/appInfo";
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
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
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
