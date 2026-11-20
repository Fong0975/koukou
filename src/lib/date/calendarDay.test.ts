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
    { name: "nothing on an empty day", occurrences: [], expiries: [], reserveTotal: null, expected: [] },
    {
      name: "lists expiries before charges, with each charge's amount",
      occurrences: [makeOccurrence(15, netflix, { scheduleId: 10 }), makeOccurrence(15, spotify, { scheduleId: 20 })],
      expiries: [expiry],
      reserveTotal: null,
      expected: [
        { key: "expiry-3", variant: "expiry", label: "中華電信 到期", title: "中華電信 到期", amount: null },
        { key: "1-10", variant: "charge", label: "Netflix", title: "Netflix NT$ 390", amount: "NT$ 390" },
        { key: "2-20", variant: "charge", label: "Spotify", title: "Spotify US$ 10.99", amount: "US$ 10.99" },
      ],
    },
    {
      name: "puts the reserve total after the expiries and the charges",
      occurrences: [makeOccurrence(15, netflix, { scheduleId: 10 })],
      expiries: [expiry],
      reserveTotal: "NT$ 1,500",
      expected: [
        { key: "expiry-3", variant: "expiry" },
        { key: "1-10", variant: "charge" },
        { key: "reserve", variant: "reserve", icon: "🗓️", label: "預扣", title: "預扣 NT$ 1,500", amount: "NT$ 1,500" },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(dayChips(tt.occurrences, tt.expiries, tt.reserveTotal)).toMatchObject(tt.expected);
    });
  }
});

describe("cellLabel", () => {
  const tests = [
    {
      name: "just the date on an empty day",
      isToday: false,
      occurrences: [],
      expiries: [],
      reserveTotal: null,
      expected: "15 日",
    },
    {
      name: "marks today",
      isToday: true,
      occurrences: [],
      expiries: [],
      reserveTotal: null,
      expected: "15 日（今天）",
    },
    {
      name: "names the charges, then the expiries",
      isToday: false,
      occurrences: [makeOccurrence(15, netflix), makeOccurrence(15, spotify)],
      expiries: [expiry],
      reserveTotal: null,
      expected: "15 日：Netflix、Spotify；到期：中華電信",
    },
    {
      name: "ends with the reserve total",
      isToday: false,
      occurrences: [makeOccurrence(15, netflix)],
      expiries: [expiry],
      reserveTotal: "NT$ 1,500",
      expected: "15 日：Netflix；到期：中華電信；預扣：NT$ 1,500",
    },
    {
      name: "a day with only the reserve total",
      isToday: false,
      occurrences: [],
      expiries: [],
      reserveTotal: "NT$ 1,500",
      expected: "15 日：預扣：NT$ 1,500",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(cellLabel(15, tt.isToday, tt.occurrences, tt.expiries, tt.reserveTotal)).toBe(tt.expected);
    });
  }
});
