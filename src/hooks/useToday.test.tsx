import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useToday } from "./useToday";

function TodayProbe() {
  const today = useToday();
  return <span>{today ? `${today.year}-${today.month}-${today.day}` : "unknown"}</span>;
}

/** Renders the hook, then lets time pass or events happen, and reads the date it ends up with. */
function readAfter(advance: () => void) {
  const { result } = renderHook(() => useToday());
  act(advance);
  return result.current;
}

const MINUTE = 60 * 1000;

describe("useToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const tests = [
    {
      name: "reads the local date in the browser",
      now: new Date(2026, 9, 16, 23, 30),
      render: () => readAfter(() => {}),
      expected: { year: 2026, month: 10, day: 16 },
    },
    {
      name: "keeps single-digit months and days apart",
      now: new Date(2027, 0, 5, 8, 0),
      render: () => readAfter(() => {}),
      expected: { year: 2027, month: 1, day: 5 },
    },
    {
      name: "is unknown while rendering on the server",
      now: new Date(2026, 9, 16),
      render: () => renderToString(<TodayProbe />),
      expected: "<span>unknown</span>",
    },
    {
      name: "moves to the next day after local midnight",
      now: new Date(2026, 9, 16, 23, 30),
      render: () => readAfter(() => vi.advanceTimersByTime(31 * MINUTE)),
      expected: { year: 2026, month: 10, day: 17 },
    },
    {
      name: "stays on the same day before midnight",
      now: new Date(2026, 9, 16, 23, 30),
      render: () => readAfter(() => vi.advanceTimersByTime(20 * MINUTE)),
      expected: { year: 2026, month: 10, day: 16 },
    },
    {
      name: "re-reads the date when the tab comes back into view",
      now: new Date(2026, 9, 16, 23, 30),
      render: () =>
        readAfter(() => {
          vi.setSystemTime(new Date(2026, 9, 18, 9, 0));
          document.dispatchEvent(new Event("visibilitychange"));
        }),
      expected: { year: 2026, month: 10, day: 18 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      vi.useFakeTimers();
      vi.setSystemTime(tt.now);

      expect(tt.render()).toEqual(tt.expected);
    });
  }
});
