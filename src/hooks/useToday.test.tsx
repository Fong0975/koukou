import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useToday } from "./useToday";

function TodayProbe() {
  const today = useToday();
  return <span>{today ? `${today.year}-${today.month}-${today.day}` : "unknown"}</span>;
}

describe("useToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const tests = [
    {
      name: "reads the local date in the browser",
      now: new Date(2026, 9, 16, 23, 30),
      render: () => {
        const { result } = renderHook(() => useToday());
        return result.current;
      },
      expected: { year: 2026, month: 10, day: 16 },
    },
    {
      name: "keeps single-digit months and days apart",
      now: new Date(2027, 0, 5, 8, 0),
      render: () => {
        const { result } = renderHook(() => useToday());
        return result.current;
      },
      expected: { year: 2027, month: 1, day: 5 },
    },
    {
      name: "is unknown while rendering on the server",
      now: new Date(2026, 9, 16),
      render: () => renderToString(<TodayProbe />),
      expected: "<span>unknown</span>",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(tt.now);

      expect(tt.render()).toEqual(tt.expected);
    });
  }
});
