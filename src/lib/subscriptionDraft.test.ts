// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import {
  draftFromDto,
  draftToInput,
  emptyDraft,
  newScheduleDraft,
  toFieldErrors,
  type SubscriptionDraft,
} from "./subscriptionDraft";

const dto = makeSubscription({
  id: 7,
  currency: "USD",
  amount: "15.50",
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

describe("emptyDraft", () => {
  const tests = [{ name: "starts blank in TWD with one monthly schedule" }];

  for (const tt of tests) {
    it(tt.name, () => {
      const draft = emptyDraft();
      expect(draft).toMatchObject({
        name: "",
        categoryId: "",
        paymentMethodId: "",
        currency: "TWD",
        amount: "",
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
      expected: { name: "Netflix", categoryId: "2", paymentMethodId: "3", currency: "USD", amount: "15.5", note: "" },
      expectedSchedules: [
        { cycle: "MONTHLY", dayOfMonth: "15", dayOfWeek: "1", month: "1" },
        { cycle: "WEEKLY", dayOfWeek: "0", dayOfMonth: "1", month: "1" },
      ],
    },
    {
      name: "keeps notes and whole amounts",
      dto: { ...dto, amount: "390.00", note: "家庭方案" },
      expected: { amount: "390", note: "家庭方案" },
      expectedSchedules: [{ cycle: "MONTHLY" }, { cycle: "WEEKLY" }],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const draft = draftFromDto(tt.dto);
      expect(draft).toMatchObject(tt.expected);
      expect(draft.schedules).toHaveLength(tt.expectedSchedules.length);
      tt.expectedSchedules.forEach((schedule, i) => expect(draft.schedules[i]).toMatchObject(schedule));
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
