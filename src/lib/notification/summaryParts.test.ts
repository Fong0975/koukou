// @vitest-environment node
import { describe, expect, it } from "vitest";
import { pill } from "./cardParts";
import type { FlexNode } from "./lineMessage";
import { expiryRow, pillRow } from "./summaryParts";

describe("pillRow", () => {
  const tests = [{ name: "holds the pill on a line of its own" }];

  for (const tt of tests) {
    it(tt.name, () => {
      const node = pill("NT$ 1", "#111111", "#222222");
      expect(pillRow(node)).toEqual({ type: "box", layout: "horizontal", contents: [node] });
    });
  }
});

describe("expiryRow", () => {
  const tests = [
    { name: "uses the darker background on even rows", index: 0, background: "#E6EEE1" },
    { name: "uses the lighter background on odd rows", index: 1, background: "#F1F6ED" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const row = expiryRow("11/8 (日)", "中華電信", tt.index);
      expect(row.backgroundColor).toBe(tt.background);
      expect((row.contents as FlexNode[]).map((node) => node.text)).toEqual(["11/8 (日)", "｜", "中華電信"]);
    });
  }
});
