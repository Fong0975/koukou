// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import { cellLabel, dayChips } from "./calendarDay";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "10.99" });
const telecom = makeSubscription({ id: 3, name: "中華電信" });
const expiry = { day: 15, date: "2026-10-15", subscription: telecom };

describe("dayChips", () => {
  const tests = [
    { name: "nothing on an empty day", occurrences: [], expiries: [], expected: [] },
    {
      name: "lists expiries before charges, with each charge's amount",
      occurrences: [makeOccurrence(15, netflix, { scheduleId: 10 }), makeOccurrence(15, spotify, { scheduleId: 20 })],
      expiries: [expiry],
      expected: [
        { key: "expiry-3", variant: "expiry", label: "中華電信 到期", title: "中華電信 到期", amount: null },
        { key: "1-10", variant: "charge", label: "Netflix", title: "Netflix NT$ 390", amount: "NT$ 390" },
        { key: "2-20", variant: "charge", label: "Spotify", title: "Spotify US$ 10.99", amount: "US$ 10.99" },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(dayChips(tt.occurrences, tt.expiries)).toMatchObject(tt.expected);
    });
  }
});

describe("cellLabel", () => {
  const tests = [
    { name: "just the date on an empty day", isToday: false, occurrences: [], expiries: [], expected: "15 日" },
    { name: "marks today", isToday: true, occurrences: [], expiries: [], expected: "15 日（今天）" },
    {
      name: "names the charges, then the expiries",
      isToday: false,
      occurrences: [makeOccurrence(15, netflix), makeOccurrence(15, spotify)],
      expiries: [expiry],
      expected: "15 日：Netflix、Spotify；到期：中華電信",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(cellLabel(15, tt.isToday, tt.occurrences, tt.expiries)).toBe(tt.expected);
    });
  }
});
