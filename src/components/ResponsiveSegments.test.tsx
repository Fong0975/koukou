import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResponsiveSegments } from "./ResponsiveSegments";

/** Reads one wording's line and the segments kept on one line within it. */
const wording = (line: Element | null) => ({
  text: line?.textContent,
  segments: [...(line?.querySelectorAll(".whitespace-nowrap") ?? [])].map((segment) => segment.textContent),
});

describe("ResponsiveSegments", () => {
  const tests = [
    {
      name: "shows the compact wording on narrow screens and the full one from sm up",
      full: ["2027 年度", "第 3/12 期", "月均 NT$ 83.3"],
      compact: ["2027 年 3/12 期", "NT$ 83.3/月"],
      expectedCompact: "2027 年 3/12 期 · NT$ 83.3/月",
      expectedFull: "2027 年度 · 第 3/12 期 · 月均 NT$ 83.3",
    },
    {
      name: "a single segment has no separator",
      full: ["全部"],
      compact: ["全"],
      expectedCompact: "全",
      expectedFull: "全部",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<ResponsiveSegments full={tt.full} compact={tt.compact} />);
      const [compactLine, fullLine] = container.children;

      expect(compactLine).toHaveClass("sm:hidden");
      expect(wording(compactLine)).toEqual({ text: tt.expectedCompact, segments: tt.compact });
      expect(fullLine).toHaveClass("hidden", "sm:inline");
      expect(wording(fullLine)).toEqual({ text: tt.expectedFull, segments: tt.full });
    });
  }
});
