import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME, BACKGROUND_COLOR, THEME_COLOR } from "@/lib/constants/appInfo";

/**
 * Web app manifest served at `/manifest.webmanifest`, which makes the app installable as a PWA.
 *
 * @returns The manifest describing the app's name, colors and install icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    lang: "zh-Hant-TW",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      { src: "/logo192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo-maskable192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/logo-maskable512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
