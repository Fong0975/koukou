// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatChartTwd, toChartValue } from "./chartTheme";

describe("formatChartTwd", () => {
  const tests = [
    { name: "whole dollars", value: 1290, expected: "NT$ 1,290" },
    { name: "dollars with cents", value: 999.5, expected: "NT$ 999.50" },
    { name: "a numeric string", value: "390", expected: "NT$ 390" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatChartTwd(tt.value)).toBe(tt.expected);
    });
  }
});

describe("toChartValue", () => {
  const tests = [
    { name: "whole dollars", twdCents: 39000, expected: 390 },
    { name: "cents", twdCents: 99950, expected: 999.5 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toChartValue(tt.twdCents)).toBe(tt.expected);
    });
  }
});
