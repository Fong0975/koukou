// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import {
  draftFromDto,
  draftToInput,
  emptyDraft,
  newAmountPeriodDraft,
  newScheduleDraft,
  nextAmountPeriodDraft,
  toFieldErrors,
  type SubscriptionDraft,
} from "./subscriptionDraft";

const dto = makeSubscription({
  id: 7,
  currency: "USD",
  amount: "15.50",
  startDate: "2026-02-10",
  amountPeriods: [
    { id: 1, amount: "12.00", endDate: "2026-03-31" },
    { id: 2, amount: "13.99", endDate: "2026-06-30" },
  ],
  schedules: [
    { id: 1, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null },
    { id: 2, cycle: "WEEKLY", dayOfWeek: 0, dayOfMonth: null, month: null },
  ],
});

describe("newScheduleDraft", () => {
  const tests = [
    { name: "defaults to monthly on day 1", values: {}, expected: { cycle: "MONTHLY", dayOfMonth: "1" } },
    {
      name: "applies overrides",
      values: { cycle: "YEARLY", month: "3" } as const,
      expected: { cycle: "YEARLY", month: "3" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const first = newScheduleDraft(tt.values);
      const second = newScheduleDraft(tt.values);
      expect(first).toMatchObject(tt.expected);
      expect(first.key).not.toBe(second.key);
    });
  }
});

describe("newAmountPeriodDraft", () => {
  const tests = [
    { name: "keeps the given values", values: { amount: "100", endDate: "2026-10-17" } },
    { name: "accepts blank values", values: { amount: "", endDate: "" } },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const first = newAmountPeriodDraft(tt.values);
      const second = newAmountPeriodDraft(tt.values);
      expect(first).toMatchObject(tt.values);
      expect(first.key).not.toBe(second.key);
    });
  }
});

describe("nextAmountPeriodDraft", () => {
  const today = "2026-10-17";
  const period = (endDate: string) => newAmountPeriodDraft({ amount: "100", endDate });

  const tests = [
    {
      name: "copies the current amount and ends today",
      draft: { amount: "390", startDate: "2026-01-01", amountPeriods: [] },
      expected: { amount: "390", endDate: "2026-10-17" },
    },
    {
      name: "ends today when earlier rows ended before today",
      draft: { amount: "390", startDate: "2026-01-01", amountPeriods: [period("2026-05-31")] },
      expected: { amount: "390", endDate: "2026-10-17" },
    },
    {
      name: "ends the day after a row that already ends today",
      draft: { amount: "390", startDate: "2026-01-01", amountPeriods: [period("2026-10-17")] },
      expected: { amount: "390", endDate: "2026-10-18" },
    },
    {
      name: "ends after the latest future row, whatever the row order",
      draft: {
        amount: "390",
        startDate: "2026-01-01",
        amountPeriods: [period("2026-12-31"), period("2026-11-30")],
      },
      expected: { amount: "390", endDate: "2027-01-01" },
    },
    {
      name: "ends on a future start date",
      draft: { amount: "390", startDate: "2026-12-01", amountPeriods: [] },
      expected: { amount: "390", endDate: "2026-12-01" },
    },
    {
      name: "falls back to today when the start date is blank",
      draft: { amount: "", startDate: "", amountPeriods: [] },
      expected: { amount: "", endDate: "2026-10-17" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const row = nextAmountPeriodDraft(tt.draft, today);
      expect(row).toMatchObject(tt.expected);
      expect(row.key).toMatch(/^amount-period-/);
    });
  }
});

describe("emptyDraft", () => {
  const tests = [
    { name: "starts blank in TWD with one monthly schedule", startDate: "2026-10-17" },
    { name: "uses the given start date", startDate: "2027-01-01" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const draft = emptyDraft(tt.startDate);
      expect(draft).toMatchObject({
        name: "",
        categoryId: "",
        paymentMethodId: "",
        currency: "TWD",
        amount: "",
        startDate: tt.startDate,
        amountPeriods: [],
        note: "",
      });
      expect(draft.schedules).toHaveLength(1);
      expect(draft.schedules[0]).toMatchObject({ cycle: "MONTHLY", dayOfMonth: "1" });
    });
  }
});

describe("draftFromDto", () => {
  const tests = [
    {
      name: "maps fields to strings",
      dto,
      expected: {
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "USD",
        amount: "15.5",
        startDate: "2026-02-10",
        note: "",
      },
      expectedSchedules: [
        { cycle: "MONTHLY", dayOfMonth: "15", dayOfWeek: "1", month: "1" },
        { cycle: "WEEKLY", dayOfWeek: "0", dayOfMonth: "1", month: "1" },
      ],
      expectedAmountPeriods: [
        { amount: "12", endDate: "2026-03-31" },
        { amount: "13.99", endDate: "2026-06-30" },
      ],
    },
    {
      name: "keeps notes and whole amounts",
      dto: { ...dto, amount: "390.00", note: "家庭方案", amountPeriods: [] },
      expected: { amount: "390", note: "家庭方案" },
      expectedSchedules: [{ cycle: "MONTHLY" }, { cycle: "WEEKLY" }],
      expectedAmountPeriods: [],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const draft = draftFromDto(tt.dto);
      expect(draft).toMatchObject(tt.expected);
      expect(draft.schedules).toHaveLength(tt.expectedSchedules.length);
      tt.expectedSchedules.forEach((schedule, i) => expect(draft.schedules[i]).toMatchObject(schedule));
      expect(draft.amountPeriods).toHaveLength(tt.expectedAmountPeriods.length);
      tt.expectedAmountPeriods.forEach((period, i) => expect(draft.amountPeriods[i]).toMatchObject(period));
    });
  }
});

describe("draftToInput", () => {
  const base: SubscriptionDraft = {
    name: "Netflix",
    categoryId: "2",
    paymentMethodId: "3",
    currency: "TWD",
    amount: "390",
    startDate: "2026-01-01",
    amountPeriods: [newAmountPeriodDraft({ amount: "350", endDate: "2026-05-31" })],
    note: "",
    schedules: [],
  };
  const schedule = (cycle: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY") =>
    newScheduleDraft({ cycle, dayOfWeek: "3", dayOfMonth: "15", month: "6" });

  const tests = [
    { name: "daily keeps no day fields", cycle: "DAILY", expected: { cycle: "DAILY" } },
    { name: "weekly keeps dayOfWeek", cycle: "WEEKLY", expected: { cycle: "WEEKLY", dayOfWeek: "3" } },
    { name: "monthly keeps dayOfMonth", cycle: "MONTHLY", expected: { cycle: "MONTHLY", dayOfMonth: "15" } },
    {
      name: "yearly keeps month and day",
      cycle: "YEARLY",
      expected: { cycle: "YEARLY", month: "6", dayOfMonth: "15" },
    },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      const input = draftToInput({ ...base, schedules: [schedule(tt.cycle)] });
      expect(input).toEqual({
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "TWD",
        amount: "390",
        startDate: "2026-01-01",
        amountPeriods: [{ amount: "350", endDate: "2026-05-31" }],
        note: "",
        schedules: [tt.expected],
      });
    });
  }
});

describe("toFieldErrors", () => {
  const tests = [
    {
      name: "joins array paths",
      issues: [{ path: ["schedules", 0, "dayOfMonth"], message: "日期需介於 1–31" }],
      expected: { "schedules.0.dayOfMonth": "日期需介於 1–31" },
    },
    {
      name: "accepts string paths from API details",
      issues: [{ path: "name", message: "請輸入項目名稱" }],
      expected: { name: "請輸入項目名稱" },
    },
    {
      name: "keeps the first message per path",
      issues: [
        { path: ["amount"], message: "first" },
        { path: ["amount"], message: "second" },
      ],
      expected: { amount: "first" },
    },
    { name: "empty list", issues: [], expected: {} },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toFieldErrors(tt.issues)).toEqual(tt.expected);
    });
  }
});
