import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import type { CalendarDate } from "@/lib/calendarMonth";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import { BillingCalendar } from "./BillingCalendar";

const april = { year: 2026, month: 4 };
const netflix = makeSubscription({ id: 1, name: "Netflix" });
const spotify = makeSubscription({ id: 2, name: "Spotify" });

describe("BillingCalendar", () => {
  const tests: {
    name: string;
    today: CalendarDate;
    occurrences: Occurrence[];
    expiries?: ContractExpiry[];
    expectedCells: string[];
    expectedMissing?: string[];
  }[] = [
    {
      name: "marks charges on their days",
      today: { year: 2026, month: 3, day: 1 },
      occurrences: [
        makeOccurrence(1, netflix, { scheduleId: 10 }),
        makeOccurrence(1, spotify, { scheduleId: 20 }),
        makeOccurrence(30, netflix, { scheduleId: 11 }),
      ],
      expectedCells: ["1 日：Netflix、Spotify", "2 日", "30 日：Netflix"],
      expectedMissing: ["31 日"],
    },
    {
      name: "marks contract expiries on their days",
      today: { year: 2026, month: 3, day: 1 },
      occurrences: [makeOccurrence(1, netflix, { scheduleId: 10 })],
      expiries: [
        { day: 1, date: "2026-04-01", subscription: spotify },
        { day: 20, date: "2026-04-20", subscription: netflix },
      ],
      expectedCells: ["1 日：Netflix；合約到期：Spotify", "20 日：合約到期：Netflix"],
    },
    {
      name: "highlights today inside the shown month",
      today: { year: 2026, month: 4, day: 16 },
      occurrences: [],
      expectedCells: ["16 日（今天）", "15 日"],
    },
    {
      name: "does not highlight the same day of another month",
      today: { year: 2025, month: 4, day: 16 },
      occurrences: [],
      expectedCells: ["16 日"],
      expectedMissing: ["16 日（今天）"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <BillingCalendar month={april} today={tt.today} occurrences={tt.occurrences} expiries={tt.expiries ?? []} />,
      );

      expect(screen.getByRole("table", { name: "2026 年 4 月扣款行事曆" })).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
        "日",
        "一",
        "二",
        "三",
        "四",
        "五",
        "六",
      ]);
      // April 2026 starts on a Wednesday: 3 leading and 2 trailing padding cells.
      expect(screen.getAllByRole("row")).toHaveLength(6);
      for (const name of tt.expectedCells) expect(screen.getByRole("cell", { name })).toBeInTheDocument();
      for (const name of tt.expectedMissing ?? []) expect(screen.queryByRole("cell", { name })).not.toBeInTheDocument();
    });
  }
});
