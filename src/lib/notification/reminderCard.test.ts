// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makePaymentMethod, makeSubscription } from "@/test/fixtures";
import { sectionsOf, textsOf, titleRowOf } from "@/test/flex";
import type { DailyReminders } from "./dueReminders";
import { buildReminderCard } from "./reminderCard";

const netflix = makeSubscription({ id: 1, name: "Netflix" });
const telecom = makeSubscription({
  id: 2,
  name: "中華電信",
  amount: "599.00",
  paymentMethod: makePaymentMethod({ type: "BANK_ACCOUNT", name: "台新帳戶" }),
});

const empty: DailyReminders = { today: "2026-11-08", charges: [], expiries: [] };

const full: DailyReminders = {
  today: "2026-11-08",
  charges: [
    { date: "2026-11-08", daysBefore: 0, subscription: netflix, amount: "390.00" },
    { date: "2026-11-08", daysBefore: 0, subscription: telecom, amount: "599.00" },
    { date: "2026-11-11", daysBefore: 3, subscription: netflix, amount: "390.00" },
  ],
  expiries: [
    { date: "2026-11-08", daysBefore: 0, subscription: telecom },
    { date: "2026-11-15", daysBefore: 7, subscription: netflix },
  ],
};

describe("buildReminderCard", () => {
  const tests: {
    name: string;
    reminders: DailyReminders;
    /** The card's alt text; null when nothing is sent. */
    altText: string | null;
    /** Titles of the sections shown, in order. */
    titles?: string[];
    /** Texts that must show. */
    shows?: string[];
  }[] = [
    { name: "returns null when there is nothing to send", reminders: empty, altText: null },
    {
      name: "shows contract ends before charges",
      reminders: full,
      altText: "🔔 扣款 3 筆・到期 2 項｜11/8 (日)",
      titles: ["合約到期", "扣款提醒"],
      shows: [
        "2 項",
        "3 筆",
        "今天",
        "7 天後 (11/15)",
        "11/08(日)・今天",
        "11/11(三)・3 天後",
        "Netflix",
        "NT$ 390",
        "台新帳戶",
      ],
    },
    {
      name: "leaves out the contract ends when there are none",
      reminders: { ...full, expiries: [] },
      altText: "🔔 扣款 3 筆｜11/8 (日)",
      titles: ["扣款提醒"],
    },
    {
      name: "leaves out the charges when there are none",
      reminders: { ...full, charges: [] },
      altText: "🔔 到期 2 項｜11/8 (日)",
      titles: ["合約到期"],
    },
    {
      name: "names tomorrow",
      reminders: {
        ...empty,
        expiries: [{ date: "2026-11-09", daysBefore: 1, subscription: netflix }],
      },
      altText: "🔔 到期 1 項｜11/8 (日)",
      titles: ["合約到期"],
      shows: ["明天 (11/9)"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const card = buildReminderCard(tt.reminders);
      if (tt.altText === null) {
        expect(card).toBeNull();
        return;
      }

      expect(card!.type).toBe("flex");
      expect(card!.altText).toBe(tt.altText);
      const sections = sectionsOf(card!.contents);
      const texts = textsOf(sections);
      expect(["合約到期", "扣款提醒"].filter((title) => texts.includes(title))).toEqual(tt.titles);
      expect(sections).toHaveLength(tt.titles!.length);
      for (const text of tt.shows ?? []) expect(texts).toContain(text);
    });
  }
});

describe("buildReminderCard frame", () => {
  const tests: { name: string; check: (card: NonNullable<ReturnType<typeof buildReminderCard>>) => void }[] = [
    {
      name: "titles the header and repeats the summary line under it",
      check: (card) => {
        expect(textsOf(card.contents.header)).toEqual(["🔔", "今日提醒", "扣款 3 筆・到期 2 項｜11/8 (日)"]);
      },
    },
    {
      name: "counts each section on its title row",
      check: (card) => {
        const [expiry, charge] = sectionsOf(card.contents).map(titleRowOf);
        expect(textsOf(expiry)).toEqual(["⏰", "合約到期", "2 項"]);
        expect(textsOf(charge)).toEqual(["💳", "扣款提醒", "3 筆"]);
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      tt.check(buildReminderCard(full)!);
    });
  }
});

describe("buildReminderCard length limit", () => {
  const charges = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      date: "2026-11-08",
      daysBefore: 0,
      subscription: makeSubscription({ id: index + 1, name: `很長的扣款項目名稱${index}`.padEnd(60, "＊") }),
      amount: "1.00",
    }));
  const expiries = (count: number) =>
    charges(count).map(({ date, daysBefore, subscription }) => ({ date, daysBefore, subscription }));

  const tests: { name: string; reminders: DailyReminders; hidden: string[] }[] = [
    { name: "cuts a long charge list", reminders: { ...empty, charges: charges(100) }, hidden: ["…另 70 項"] },
    { name: "cuts a long expiry list", reminders: { ...empty, expiries: expiries(45) }, hidden: ["…另 15 項"] },
    { name: "keeps short lists whole", reminders: full, hidden: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const card = buildReminderCard(tt.reminders)!;
      const shown = textsOf(sectionsOf(card.contents)).flatMap((text) => text.match(/…另 \d+ 項/g) ?? []);

      expect(shown).toEqual(tt.hidden);
      expect(JSON.stringify(card).length).toBeLessThan(50_000);
    });
  }
});
