// @vitest-environment node
import { describe, expect, it } from "vitest";
import { categoryInputSchema } from "./categorySchema";

describe("categoryInputSchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; errorPath?: string }[] = [
    {
      name: "trims name and defaults icon to null",
      input: { name: " 健身房 " },
      expected: { name: "健身房", icon: null },
    },
    { name: "keeps icon", input: { name: "健身房", icon: "🏋️" }, expected: { name: "健身房", icon: "🏋️" } },
    { name: "blank icon becomes null", input: { name: "健身房", icon: " " }, expected: { name: "健身房", icon: null } },
    { name: "rejects blank name", input: { name: "" }, errorPath: "name" },
    { name: "rejects name over 50 chars", input: { name: "a".repeat(51) }, errorPath: "name" },
    { name: "rejects icon over 16 chars", input: { name: "x", icon: "a".repeat(17) }, errorPath: "icon" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = categoryInputSchema.safeParse(tt.input);
      if (tt.errorPath) {
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(tt.errorPath);
      } else {
        expect(result.data).toEqual(tt.expected);
      }
    });
  }
});
