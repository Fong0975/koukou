// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatAppVersion } from "./appVersion";

describe("formatAppVersion", () => {
  const tests: { name: string; version: string | undefined; expected: string }[] = [
    { name: "prefixes a semantic version with v", version: "0.1.3", expected: "v0.1.3" },
    { name: "does not double an existing v prefix", version: "v1.2.0", expected: "v1.2.0" },
    { name: "trims whitespace", version: " 2.0.0 ", expected: "v2.0.0" },
    { name: "falls back to dev when missing", version: undefined, expected: "dev" },
    { name: "falls back to dev when blank", version: "  ", expected: "dev" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatAppVersion(tt.version)).toBe(tt.expected);
    });
  }
});
