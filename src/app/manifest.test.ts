// @vitest-environment node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  const result = manifest();
  const icons = result.icons ?? [];

  const tests = [
    { name: "has an any-purpose 192x192 icon", purpose: "any", sizes: "192x192" },
    { name: "has an any-purpose 512x512 icon", purpose: "any", sizes: "512x512" },
    { name: "has a maskable 192x192 icon", purpose: "maskable", sizes: "192x192" },
    { name: "has a maskable 512x512 icon", purpose: "maskable", sizes: "512x512" },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      const icon = icons.find((i) => i.purpose === tt.purpose && i.sizes === tt.sizes);
      expect(icon).toBeDefined();
      expect(icon?.type).toBe("image/png");
      expect(existsSync(join(process.cwd(), "public", icon!.src))).toBe(true);
    });
  }
});
