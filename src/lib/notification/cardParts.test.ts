// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { FlexNode } from "./lineMessage";
import { cardHeader, COIN_HEADER, expiryRow, pill, pillRow, rowBackground, sectionCard } from "./cardParts";

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

describe("rowBackground", () => {
  const rows = ["#111111", "#222222"] as const;
  const tests = [
    { name: "uses the first shade on even rows", index: 0, expected: "#111111" },
    { name: "uses the second shade on odd rows", index: 3, expected: "#222222" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(rowBackground(rows, tt.index)).toBe(tt.expected);
    });
  }
});

describe("cardHeader", () => {
  const tests = [{ name: "shows the icon, title and subtitle in the style's colors" }];

  for (const tt of tests) {
    it(tt.name, () => {
      const header = cardHeader("🔔", "今日提醒", "扣款 1 筆", COIN_HEADER);
      const [icon, titles] = header.contents as FlexNode[];

      expect(header.background).toMatchObject({ startColor: COIN_HEADER.startColor, endColor: COIN_HEADER.endColor });
      expect(icon.backgroundColor).toBe(COIN_HEADER.iconBackground);
      expect(icon.contents).toMatchObject([{ text: "🔔" }]);
      expect(titles.contents).toMatchObject([
        { text: "今日提醒", color: COIN_HEADER.titleColor },
        { text: "扣款 1 筆", color: COIN_HEADER.subtitleColor },
      ]);
    });
  }
});
