// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import { sectionsOf, textsOf, titleRowOf } from "@/test/flex";
import type { MonthlySummary } from "./dueReminders";
import { buildSummaryMessage } from "./summaryMessage";

const telecom = makeSubscription({ id: 2, name: "中華電信", amount: "599.00" });

const summary: MonthlySummary = {
  month: { year: 2026, month: 11 },
  expiries: [{ day: 20, date: "2026-11-20", subscription: telecom }],
  reserve: { totals: { TWD: 10000 }, names: ["網域"] },
  charge: { totals: { TWD: 98900, USD: 2000 }, names: ["Netflix", "中華電信", "ChatGPT"] },
};

const quiet: MonthlySummary = {
  ...summary,
  expiries: [],
  reserve: { totals: {}, names: [] },
  charge: { totals: {}, names: [] },
};

describe("buildSummaryMessage", () => {
  const tests: {
    name: string;
    summary: MonthlySummary;
    /** Titles of the sections shown, in order. */
    titles: string[];
    /** Texts that must show. */
    shows?: string[];
  }[] = [
    {
      name: "lists expiries, reserves and charges, expiries first",
      summary,
      titles: ["本月到期", "本月預扣", "本月扣款"],
      shows: ["1 項", "11/20 (五)", "中華電信", "NT$ 100", "網域", "NT$ 989 + US$ 20.00", "Netflix、中華電信、ChatGPT"],
    },
    {
      name: "leaves out sections with nothing to report",
      summary: { ...summary, expiries: [], reserve: { totals: {}, names: [] } },
      titles: ["本月扣款"],
    },
    {
      name: "leaves the charges out when only others have something",
      summary: { ...quiet, expiries: summary.expiries },
      titles: ["本月到期"],
    },
    {
      name: "shows zero charges for a month with nothing at all",
      summary: quiet,
      titles: ["本月扣款"],
      shows: ["NT$ 0"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const message = buildSummaryMessage(tt.summary, "token");
      const texts = textsOf(sectionsOf(message.contents));

      const shownTitles = ["本月到期", "本月預扣", "本月扣款"].filter((title) => texts.includes(title));
      expect(shownTitles).toEqual(tt.titles);
      expect(sectionsOf(message.contents)).toHaveLength(tt.titles.length);
      for (const text of tt.shows ?? []) expect(texts).toContain(text);
    });
  }
});

describe("buildSummaryMessage frame", () => {
  const tests: { name: string; check: (message: ReturnType<typeof buildSummaryMessage>) => void }[] = [
    {
      name: "is a Flex message whose alt text names the month",
      check: (message) => {
        expect(message.type).toBe("flex");
        expect(message.altText).toBe("📅 11 月摘要");
      },
    },
    {
      name: "titles the header with the month",
      check: (message) => expect(textsOf(message.contents.header)).toContain("11 月摘要"),
    },
    {
      name: "picks the picture by the token",
      check: (message) =>
        expect(message.contents.hero).toMatchObject({ url: "https://picsum.photos/1024/358.jpg?random=token" }),
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      tt.check(buildSummaryMessage(summary, "token"));
    });
  }
});

describe("buildSummaryMessage amount placement", () => {
  const tests: { name: string; totals: MonthlySummary["charge"]["totals"]; onTitleRow: boolean }[] = [
    { name: "puts a single currency beside the title", totals: { TWD: 39000 }, onTitleRow: true },
    { name: "puts a zero total beside the title", totals: {}, onTitleRow: true },
    { name: "puts several currencies below the title", totals: { TWD: 39000, USD: 2000 }, onTitleRow: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { contents } = buildSummaryMessage(
        { ...quiet, charge: { totals: tt.totals, names: ["Netflix"] } },
        "token",
      );
      const [section] = sectionsOf(contents);
      expect(titleRowOf(section)).toHaveLength(tt.onTitleRow ? 3 : 2);
    });
  }
});

describe("buildSummaryMessage length limit", () => {
  const names = (count: number) =>
    Array.from({ length: count }, (_, index) => `很長的訂閱項目名稱${index}`.padEnd(60, "＊"));
  const expiries = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      day: 20,
      date: "2026-11-20",
      subscription: makeSubscription({ id: index + 1, name: `合約${index}` }),
    }));

  const tests: { name: string; summary: MonthlySummary; hidden: string[] }[] = [
    {
      name: "cuts long name lists",
      summary: {
        ...quiet,
        reserve: { totals: { TWD: 100 }, names: names(100) },
        charge: { totals: { TWD: 100 }, names: names(45) },
      },
      hidden: ["…另 70 項", "…另 15 項"],
    },
    { name: "cuts a long expiry list", summary: { ...quiet, expiries: expiries(100) }, hidden: ["…另 70 項"] },
    { name: "keeps short lists whole", summary, hidden: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const message = buildSummaryMessage(tt.summary, "token");
      const shown = textsOf(sectionsOf(message.contents)).flatMap((text) => text.match(/…另 \d+ 項/g) ?? []);

      expect(shown).toEqual(tt.hidden);
      expect(JSON.stringify(message).length).toBeLessThan(50_000);
    });
  }
});
