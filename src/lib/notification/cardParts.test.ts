// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { FlexNode } from "./lineMessage";
import { cardHeader, COIN_HEADER, flexCard, moreRows, pill, rowBackground, sectionCard, stripedRow } from "./cardParts";

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

describe("moreRows", () => {
  const tests = [
    { name: "adds nothing under a whole list", hidden: 0, expected: [] },
    { name: "says how many items were left out", hidden: 3, expected: ["…另 3 項"] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(moreRows(tt.hidden).map((node) => node.text)).toEqual(tt.expected);
    });
  }
});

describe("stripedRow", () => {
  const rows = ["#111111", "#222222"] as const;
  const cell: FlexNode = { type: "text", text: "cell" };
  const tests = [
    { name: "uses the first shade on even rows", index: 0, extra: {}, expected: { backgroundColor: "#111111" } },
    {
      name: "keeps extra box properties",
      index: 1,
      extra: { alignItems: "center" },
      expected: { backgroundColor: "#222222", alignItems: "center" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(stripedRow(rows, tt.index, [cell], tt.extra)).toMatchObject({
        type: "box",
        layout: "horizontal",
        paddingAll: "10px",
        contents: [cell],
        ...tt.expected,
      });
    });
  }
});

describe("flexCard", () => {
  const header: FlexNode = { type: "box", layout: "vertical", contents: [] };
  const section: FlexNode = { type: "text", text: "section" };
  const hero: FlexNode = { type: "image", url: "https://example.com/a.jpg" };
  const tests: { name: string; hero?: FlexNode; sections: (FlexNode | false)[]; expectedSections: FlexNode[] }[] = [
    { name: "leaves out sections marked false", sections: [false, section], expectedSections: [section] },
    { name: "adds the picture under the header", hero, sections: [section], expectedSections: [section] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const card = flexCard({ altText: "alt", header, hero: tt.hero, background: "#FFFFFF", sections: tt.sections });
      const bubble = card.contents as FlexNode & { body: FlexNode };

      expect(card.altText).toBe("alt");
      expect(bubble.header).toBe(header);
      expect(bubble.hero).toBe(tt.hero);
      expect(bubble.styles).toEqual({ body: { backgroundColor: "#FFFFFF" } });
      expect(bubble.body.contents).toEqual(tt.expectedSections);
    });
  }
});
