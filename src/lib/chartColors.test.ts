// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CHART_SLOTS, chartColor } from "./chartColors";

describe("chartColor", () => {
  const tests = [
    { name: "first slot", slot: 0, expected: "var(--chart-1)" },
    { name: "last slot", slot: CHART_SLOTS - 1, expected: "var(--chart-8)" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(chartColor(tt.slot)).toBe(tt.expected);
    });
  }
});
