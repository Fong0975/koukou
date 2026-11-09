// @vitest-environment node
import { describe, expect, it } from "vitest";
import { categoryInputSchema, categoryOrderSchema } from "./categorySchema";

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
    { name: "keeps a plain emoji", input: { name: "x", icon: "💪" }, expected: { name: "x", icon: "💪" } },
    { name: "keeps a flag", input: { name: "x", icon: "🇹🇼" }, expected: { name: "x", icon: "🇹🇼" } },
    {
      name: "keeps a ZWJ sequence",
      input: { name: "x", icon: "👨‍👩‍👧" },
      expected: { name: "x", icon: "👨‍👩‍👧" },
    },
    { name: "keeps an emoji with a skin tone", input: { name: "x", icon: "👍🏽" }, expected: { name: "x", icon: "👍🏽" } },
    { name: "rejects plain letters", input: { name: "x", icon: "aaaaaaa" }, errorPath: "icon" },
    { name: "rejects a digit", input: { name: "x", icon: "1" }, errorPath: "icon" },
    { name: "rejects CJK text", input: { name: "x", icon: "健身" }, errorPath: "icon" },
    { name: "rejects several emoji", input: { name: "x", icon: "💪🏋️" }, errorPath: "icon" },
    { name: "rejects an emoji followed by text", input: { name: "x", icon: "💪a" }, errorPath: "icon" },
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

describe("categoryOrderSchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; errorPath?: string }[] = [
    { name: "keeps numeric ids", input: { ids: [3, 1, 2] }, expected: { ids: [3, 1, 2] } },
    { name: "coerces numeric strings", input: { ids: ["3", "1"] }, expected: { ids: [3, 1] } },
    { name: "rejects an empty list", input: { ids: [] }, errorPath: "ids" },
    { name: "rejects a missing list", input: {}, errorPath: "ids" },
    { name: "rejects non-numeric ids", input: { ids: ["x"] }, errorPath: "ids.0" },
    { name: "rejects non-positive ids", input: { ids: [0] }, errorPath: "ids.0" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = categoryOrderSchema.safeParse(tt.input);
      if (tt.errorPath) {
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(tt.errorPath);
      } else {
        expect(result.data).toEqual(tt.expected);
      }
    });
  }
});
