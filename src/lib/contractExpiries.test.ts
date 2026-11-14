// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import type { YearMonth } from "./calendarMonth";
import { monthContractExpiries } from "./contractExpiries";

describe("monthContractExpiries", () => {
  const phone = makeSubscription({ id: 1, name: "Phone", contractEndDate: "2026-10-31" });
  const gym = makeSubscription({ id: 2, name: "Gym", contractEndDate: "2026-10-05" });
  const insurance = makeSubscription({ id: 3, name: "Insurance", contractEndDate: "2026-10-31" });
  const open = makeSubscription({ id: 4, name: "Netflix", contractEndDate: null });
  const nextYear = makeSubscription({ id: 5, name: "Domain", contractEndDate: "2027-10-15" });

  const tests: { name: string; items: SubscriptionDto[]; target: YearMonth; expected: [string, number, string][] }[] = [
    { name: "no subscriptions", items: [], target: { year: 2026, month: 10 }, expected: [] },
    {
      name: "skips subscriptions without a contract end date or ending in another month",
      items: [open, nextYear],
      target: { year: 2026, month: 10 },
      expected: [],
    },
    {
      name: "orders by day, then by name",
      items: [phone, open, insurance, gym],
      target: { year: 2026, month: 10 },
      expected: [
        ["Gym", 5, "2026-10-05"],
        ["Insurance", 31, "2026-10-31"],
        ["Phone", 31, "2026-10-31"],
      ],
    },
    {
      name: "matches the same month of another year only in that year",
      items: [nextYear],
      target: { year: 2027, month: 10 },
      expected: [["Domain", 15, "2027-10-15"]],
    },
    { name: "a different month has none", items: [phone], target: { year: 2026, month: 11 }, expected: [] },
    {
      name: "skips an end date that falls in a pause",
      items: [
        { ...phone, pauses: [{ id: 1, startDate: "2026-10-01", endDate: "2026-10-31" }] },
        { ...gym, pauses: [{ id: 2, startDate: "2026-09-01", endDate: "2026-10-05" }] },
        insurance,
      ],
      target: { year: 2026, month: 10 },
      expected: [["Insurance", 31, "2026-10-31"]],
    },
    {
      name: "keeps an end date the day after a pause",
      items: [{ ...gym, pauses: [{ id: 1, startDate: "2026-09-01", endDate: "2026-10-04" }] }],
      target: { year: 2026, month: 10 },
      expected: [["Gym", 5, "2026-10-05"]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = monthContractExpiries(tt.items, tt.target);

      expect(result.map((expiry) => [expiry.subscription.name, expiry.day, expiry.date])).toEqual(tt.expected);
    });
  }
});
