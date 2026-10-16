import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Load the DB driver from node_modules at runtime instead of bundling it; it relies on Node built-ins.
  serverExternalPackages: ["mariadb", "@prisma/adapter-mariadb"],
  // Inline only the version string, so the browser bundle never contains the rest of package.json.
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default nextConfig;
