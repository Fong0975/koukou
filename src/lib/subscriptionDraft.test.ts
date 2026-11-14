// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import {
  draftFromDto,
  draftToInput,
  emptyDraft,
  hasYearlySchedule,
  isDraftChanged,
  newAmountPeriodDraft,
  newPauseDraft,
  newScheduleDraft,
  nextAmountPeriodDraft,
  nextPauseDraft,
  resubscribeDraft,
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

describe("newPauseDraft", () => {
  const tests = [
    { name: "keeps the given dates", values: { startDate: "2026-03-01", endDate: "2026-04-30" } },
    { name: "accepts a blank end date", values: { startDate: "2026-03-01", endDate: "" } },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const first = newPauseDraft(tt.values);
      const second = newPauseDraft(tt.values);
      expect(first).toMatchObject(tt.values);
      expect(first.key).toMatch(/^pause-/);
      expect(first.key).not.toBe(second.key);
    });
  }
});

describe("nextPauseDraft", () => {
  const today = "2026-10-17";
  const pause = (startDate: string, endDate: string) => newPauseDraft({ startDate, endDate });

  const tests = [
    {
      name: "starts today without an end date",
      draft: { startDate: "2026-01-01", pauses: [] },
      expected: "2026-10-17",
    },
    {
      name: "starts today after a pause that ended before today",
      draft: { startDate: "2026-01-01", pauses: [pause("2026-03-01", "2026-04-30")] },
      expected: "2026-10-17",
    },
    {
      name: "starts the day after the latest pause ending today or later, whatever the row order",
      draft: {
        startDate: "2026-01-01",
        pauses: [pause("2026-12-01", "2026-12-31"), pause("2026-10-01", "2026-10-31")],
      },
      expected: "2027-01-01",
    },
    {
      name: "ignores a pause without an end date",
      draft: { startDate: "2026-01-01", pauses: [pause("2026-12-01", "")] },
      expected: "2026-10-17",
    },
    {
      name: "starts on a future start date",
      draft: { startDate: "2026-12-01", pauses: [] },
      expected: "2026-12-01",
    },
    {
      name: "falls back to today when the start date is blank",
      draft: { startDate: "", pauses: [] },
      expected: "2026-10-17",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(nextPauseDraft(tt.draft, today)).toMatchObject({ startDate: tt.expected, endDate: "" });
    });
  }
});

describe("resubscribeDraft", () => {
  const earlier = newPauseDraft({ startDate: "2026-02-01", endDate: "2026-02-28" });

  const tests = [
    {
      name: "turns the days between the end date and the resume date into a pause",
      draft: { contractEndDate: "2026-06-30", pauses: [earlier] },
      resumeDate: "2026-12-01",
      expected: [
        { startDate: "2026-02-01", endDate: "2026-02-28" },
        { startDate: "2026-07-01", endDate: "2026-11-30" },
      ],
    },
    {
      name: "adds a one-day pause when it resumes two days after ending",
      draft: { contractEndDate: "2026-06-30", pauses: [] },
      resumeDate: "2026-07-02",
      expected: [{ startDate: "2026-07-01", endDate: "2026-07-01" }],
    },
    {
      name: "adds no pause when it resumes the day after ending",
      draft: { contractEndDate: "2026-06-30", pauses: [earlier] },
      resumeDate: "2026-07-01",
      expected: [{ startDate: "2026-02-01", endDate: "2026-02-28" }],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = resubscribeDraft(tt.draft, tt.resumeDate);
      expect(result.contractEndDate).toBe("");
      expect(result.pauses.map(({ startDate, endDate }) => ({ startDate, endDate }))).toEqual(tt.expected);
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
        amortize: false,
        startDate: tt.startDate,
        contractEndDate: "",
        amountPeriods: [],
        pauses: [],
        note: "",
        reminders: { chargeDaysBefore: [], expiryDaysBefore: [] },
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
        amortize: false,
        startDate: "2026-02-10",
        contractEndDate: "",
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
    {
      name: "keeps the contract end date",
      dto: { ...dto, contractEndDate: "2027-03-31", amountPeriods: [] },
      expected: { contractEndDate: "2027-03-31" },
      expectedSchedules: [{ cycle: "MONTHLY" }, { cycle: "WEEKLY" }],
      expectedAmountPeriods: [],
    },
    {
      name: "keeps the reminders",
      dto: {
        ...dto,
        contractEndDate: "2027-03-31",
        reminders: { chargeDaysBefore: [0, 3], expiryDaysBefore: [7] },
        amountPeriods: [],
      },
      expected: { reminders: { chargeDaysBefore: [0, 3], expiryDaysBefore: [7] } },
      expectedSchedules: [{ cycle: "MONTHLY" }, { cycle: "WEEKLY" }],
      expectedAmountPeriods: [],
    },
    {
      name: "keeps pauses",
      dto: {
        ...dto,
        pauses: [
          { id: 1, startDate: "2026-03-01", endDate: "2026-04-30" },
          { id: 2, startDate: "2026-08-01", endDate: "2026-08-31" },
        ],
      },
      expected: {
        pauses: [
          expect.objectContaining({ startDate: "2026-03-01", endDate: "2026-04-30" }),
          expect.objectContaining({ startDate: "2026-08-01", endDate: "2026-08-31" }),
        ],
      },
      expectedSchedules: [{ cycle: "MONTHLY" }, { cycle: "WEEKLY" }],
      expectedAmountPeriods: [
        { amount: "12", endDate: "2026-03-31" },
        { amount: "13.99", endDate: "2026-06-30" },
      ],
    },
    {
      name: "keeps the amortize flag",
      dto: { ...dto, amortize: true },
      expected: { amortize: true },
      expectedSchedules: [{ cycle: "MONTHLY" }, { cycle: "WEEKLY" }],
      expectedAmountPeriods: [
        { amount: "12", endDate: "2026-03-31" },
        { amount: "13.99", endDate: "2026-06-30" },
      ],
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
    amortize: true,
    startDate: "2026-01-01",
    contractEndDate: "2027-12-31",
    amountPeriods: [newAmountPeriodDraft({ amount: "350", endDate: "2026-05-31" })],
    pauses: [newPauseDraft({ startDate: "2026-08-01", endDate: "" })],
    note: "",
    schedules: [],
    reminders: { chargeDaysBefore: [0, 3], expiryDaysBefore: [7] },
  };
  const schedule = (cycle: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY") =>
    newScheduleDraft({ cycle, dayOfWeek: "3", dayOfMonth: "15", month: "6" });

  const tests = [
    {
      name: "daily keeps no day fields and drops amortize",
      cycle: "DAILY",
      expected: { cycle: "DAILY" },
      expectedAmortize: false,
    },
    {
      name: "weekly keeps dayOfWeek and drops amortize",
      cycle: "WEEKLY",
      expected: { cycle: "WEEKLY", dayOfWeek: "3" },
      expectedAmortize: false,
    },
    {
      name: "monthly keeps dayOfMonth and drops amortize",
      cycle: "MONTHLY",
      expected: { cycle: "MONTHLY", dayOfMonth: "15" },
      expectedAmortize: false,
    },
    {
      name: "yearly keeps month, day and amortize",
      cycle: "YEARLY",
      expected: { cycle: "YEARLY", month: "6", dayOfMonth: "15" },
      expectedAmortize: true,
    },
    {
      name: "yearly keeps amortize off when not enabled",
      cycle: "YEARLY",
      amortize: false,
      expected: { cycle: "YEARLY", month: "6", dayOfMonth: "15" },
      expectedAmortize: false,
    },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      const amortize = "amortize" in tt ? tt.amortize : base.amortize;
      const input = draftToInput({ ...base, amortize, schedules: [schedule(tt.cycle)] });
      expect(input).toEqual({
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "TWD",
        amount: "390",
        amortize: tt.expectedAmortize,
        startDate: "2026-01-01",
        contractEndDate: "2027-12-31",
        amountPeriods: [{ amount: "350", endDate: "2026-05-31" }],
        pauses: [{ startDate: "2026-08-01", endDate: "" }],
        note: "",
        schedules: [tt.expected],
        reminders: { chargeDaysBefore: [0, 3], expiryDaysBefore: [7] },
      });
    });
  }
});

describe("draftToInput reminders", () => {
  const draft = { ...emptyDraft("2026-01-01"), reminders: { chargeDaysBefore: [0, 3], expiryDaysBefore: [7, 0] } };
  const tests = [
    {
      name: "keeps expiry reminders with a contract end date",
      contractEndDate: "2027-03-31",
      expected: { chargeDaysBefore: [0, 3], expiryDaysBefore: [7, 0] },
    },
    {
      name: "drops expiry reminders once the contract end date is cleared",
      contractEndDate: "",
      expected: { chargeDaysBefore: [0, 3], expiryDaysBefore: [] },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(draftToInput({ ...draft, contractEndDate: tt.contractEndDate }).reminders).toEqual(tt.expected);
    });
  }
});

describe("hasYearlySchedule", () => {
  const tests = [
    { name: "no schedules", cycles: [], expected: false },
    { name: "only non-yearly schedules", cycles: ["DAILY", "WEEKLY", "MONTHLY"], expected: false },
    { name: "a yearly schedule among others", cycles: ["MONTHLY", "YEARLY"], expected: true },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(hasYearlySchedule(tt.cycles.map((cycle) => ({ cycle })))).toBe(tt.expected);
    });
  }
});

describe("isDraftChanged", () => {
  const initial = draftFromDto(dto);
  const tests: { name: string; draft: SubscriptionDraft; expected: boolean }[] = [
    { name: "the same draft is unchanged", draft: initial, expected: false },
    { name: "a fresh copy of the same subscription is unchanged", draft: draftFromDto(dto), expected: false },
    { name: "an edited name is a change", draft: { ...initial, name: "Netflix 4K" }, expected: true },
    {
      name: "a weekday kept on a monthly schedule is no change",
      draft: { ...initial, schedules: [{ ...initial.schedules[0], dayOfWeek: "5" }, initial.schedules[1]] },
      expected: false,
    },
    { name: "a different cycle is a change", draft: { ...initial, schedules: [initial.schedules[0]] }, expected: true },
    { name: "amortize without a yearly schedule is no change", draft: { ...initial, amortize: true }, expected: false },
    {
      name: "an added pause is a change",
      draft: { ...initial, pauses: [newPauseDraft({ startDate: "2026-08-01", endDate: "" })] },
      expected: true,
    },
    {
      name: "an added reminder is a change",
      draft: { ...initial, reminders: { ...initial.reminders, chargeDaysBefore: [1] } },
      expected: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isDraftChanged(initial, tt.draft)).toBe(tt.expected);
    });
  }
});
