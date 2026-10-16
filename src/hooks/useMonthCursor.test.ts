import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { YearMonth } from "@/lib/calendarMonth";
import { useMonthCursor } from "./useMonthCursor";

describe("useMonthCursor", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const tests: { name: string; selects: (YearMonth | null)[]; expected: YearMonth }[] = [
    { name: "starts at the current local month", selects: [], expected: { year: 2026, month: 10 } },
    { name: "shows the chosen month", selects: [{ year: 2025, month: 12 }], expected: { year: 2025, month: 12 } },
    {
      name: "clearing the choice returns to the current month",
      selects: [{ year: 2025, month: 12 }, null],
      expected: { year: 2026, month: 10 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 16, 9, 0));
      const { result } = renderHook(() => useMonthCursor());

      for (const select of tt.selects) act(() => result.current.setCursor(select));

      expect(result.current.today).toEqual({ year: 2026, month: 10, day: 16 });
      expect(result.current.cursor).toEqual(tt.expected);
    });
  }
});
