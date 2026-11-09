// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { FlexNode } from "./lineMessage";
import { expiryRow, pill, pillRow, sectionCard } from "./summaryCards";

describe("pill", () => {
  const tests = [
    { name: "shows the label in the given colors", label: "2 項", background: "#111111", color: "#222222" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(pill(tt.label, tt.background, tt.color)).toMatchObject({
        backgroundColor: tt.background,
        flex: 0,
        contents: [{ type: "text", text: tt.label, color: tt.color }],
      });
    });
  }
});

describe("sectionCard", () => {
  const side = pill("NT$ 1", "#111111", "#222222");
  const body: FlexNode = { type: "text", text: "body" };

  const tests: { name: string; side: FlexNode | null; titleRowLength: number }[] = [
    { name: "puts the side pill on the title row", side, titleRowLength: 3 },
    { name: "has only icon and title without a side pill", side: null, titleRowLength: 2 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const card = sectionCard("💳", "本月扣款", tt.side, [body]);
      const [titleRow, content] = card.contents as FlexNode[];

      expect(titleRow.contents).toHaveLength(tt.titleRowLength);
      expect(content).toBe(body);
    });
  }
});

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
