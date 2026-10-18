import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoadStatus } from "@/hooks/useSubscriptions";
import { makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto, SubscriptionDto } from "@/types/dto";

const { useYearRates } = vi.hoisted(() => ({ useYearRates: vi.fn() }));
vi.mock("@/hooks/useYearRates", () => ({ useYearRates }));

import { CalendarSection } from "./CalendarSection";

const netflix = makeSubscription({
  id: 1,
  name: "Netflix",
  schedules: [{ id: 10, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 5, month: 11 }],
});
const domain = makeSubscription({
  id: 2,
  name: "網域",
  amount: "1000.00",
  amortize: true,
  schedules: [{ id: 20, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 11, month: 10 }],
});
const spotify = makeSubscription({
  id: 3,
  name: "Spotify",
  currency: "USD",
  amount: "10.00",
  schedules: [{ id: 30, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
});
const phone = makeSubscription({
  id: 4,
  name: "中華電信",
  amount: "599.00",
  contractEndDate: "2026-10-20",
  schedules: [{ id: 40, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 25, month: null }],
});
const rates: ExchangeRateDto[] = [{ date: "2026-01-01", rate: 32 }];

/** Headings of the cards under the calendar, in document order. */
const cardHeadings = () =>
  screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent)
    .slice(1);

describe("CalendarSection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 16, 9, 0));
    useYearRates.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tests: {
    name: string;
    status: LoadStatus;
    items: SubscriptionDto[];
    rates?: ExchangeRateDto[];
    act?: () => void;
    expectDom: () => void;
    expectedRetries?: number;
    expectedRateRequest?: [number | undefined, boolean];
  }[] = [
    {
      name: "first load shows a placeholder",
      status: "loading",
      items: [],
      expectDom: () => expect(screen.getByLabelText("讀取中")).toHaveAttribute("aria-busy", "true"),
    },
    {
      name: "a load error shows the reason and retries",
      status: "error",
      items: [],
      act: () => fireEvent.click(screen.getByRole("button", { name: "重新讀取" })),
      expectDom: () => expect(screen.getByRole("alert")).toHaveTextContent("連不上伺服器"),
      expectedRetries: 1,
    },
    {
      name: "opens on the current month",
      status: "ready",
      items: [netflix],
      expectDom: () => {
        expect(screen.getByRole("heading", { name: "2026 年 10 月" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "16 日（今天）" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "回到本月" })).toBeDisabled();
        expect(screen.getByText("2026 年度總計").nextElementSibling).toHaveTextContent("NT$ 390");
        expect(screen.getByRole("cell", { name: "5 日" })).toBeInTheDocument();
        expect(screen.getByText("這個月沒有扣款。")).toBeInTheDocument();
        expect(screen.getByText("共 0 次扣款，來自 0 個項目")).toBeInTheDocument();
        expect(screen.queryByRole("list", { name: "預扣款項" })).not.toBeInTheDocument();
        expect(screen.getByRole("region", { name: "本月到期" })).toHaveTextContent("這個月沒有到期的合約。");
      },
      expectedRateRequest: [2026, false],
    },
    {
      name: "a year with foreign charges asks for rates and converts the totals",
      status: "ready",
      items: [netflix, spotify],
      rates,
      expectDom: () => {
        expect(screen.getByRole("region", { name: "本月扣款清單" })).toHaveTextContent("US$ 10.00≈ NT$ 320");
        expect(screen.getByText("本月總計").nextElementSibling?.textContent).toBe("NT$ 320");
        expect(screen.getByText("2026 年度總計").nextElementSibling?.textContent).toBe("NT$ 4,230");
        // The month's only foreign charge makes the headline, its category and its payment method all NT$ 320.
        for (const [total, count] of [
          ["NT$ 320", 3],
          ["NT$ 4,230", 1],
        ] as const) {
          expect(screen.getAllByRole("button", { name: `${total}，查看換算前金額` })).toHaveLength(count);
        }
      },
      expectedRateRequest: [2026, true],
    },
    {
      name: "foreign charges stay per currency until rates arrive",
      status: "ready",
      items: [spotify],
      expectDom: () => {
        expect(screen.getByRole("region", { name: "本月扣款清單" })).not.toHaveTextContent("≈");
        expect(screen.getByText("本月總計").nextElementSibling).toHaveTextContent("US$ 10.00");
      },
      expectedRateRequest: [2026, true],
    },
    {
      name: "an amortized yearly charge saves for next year from its charge month",
      status: "ready",
      items: [domain],
      expectDom: () => {
        expect(screen.getByText("本月總計").nextElementSibling).toHaveTextContent("NT$ 1,000");
        expect(screen.getByRole("list", { name: "預扣款項" })).toHaveTextContent(
          "網域2027 年期（10/11 扣款）NT$ 84(NT$ 83.3)",
        );
        expect(screen.getByText("預留小計").nextElementSibling).toHaveTextContent("NT$ 84");
      },
    },
    {
      name: "the month before an amortized charge saves for it",
      status: "ready",
      items: [domain],
      act: () => fireEvent.click(screen.getByRole("button", { name: "上個月" })),
      expectDom: () => {
        expect(screen.getByRole("heading", { name: "2026 年 9 月" })).toBeInTheDocument();
        expect(screen.getByRole("list", { name: "預扣款項" })).toHaveTextContent("2026 年期（10/11 扣款）");
      },
    },
    {
      name: "places expiries and reserves before the charge list and the summary",
      status: "ready",
      items: [domain],
      expectDom: () => expect(cardHeadings()).toEqual(["本月到期", "預扣款項", "本月扣款清單", "本月總結"]),
    },
    {
      name: "a contract ending this month is marked and listed, and stops charging after it",
      status: "ready",
      items: [phone],
      expectDom: () => {
        expect(screen.getByRole("cell", { name: "20 日：合約到期：中華電信" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "25 日" })).toBeInTheDocument();
        expect(screen.getByRole("list", { name: "到期項目" })).toHaveTextContent(
          "中華電信10/20（二） · 剩 4 天NT$ 599",
        );
        expect(screen.getByText("這個月沒有扣款。")).toBeInTheDocument();
      },
    },
    {
      name: "reloading keeps showing the calendar",
      status: "loading",
      items: [netflix],
      expectDom: () => expect(screen.getByRole("heading", { name: "2026 年 10 月" })).toBeInTheDocument(),
    },
    {
      name: "moving to another month shows its charges",
      status: "ready",
      items: [netflix],
      act: () => fireEvent.click(screen.getByRole("button", { name: "下個月" })),
      expectDom: () => {
        expect(screen.getByRole("heading", { name: "2026 年 11 月" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "5 日：Netflix" })).toBeInTheDocument();
        expect(screen.queryByRole("cell", { name: /今天/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "回到本月" })).toBeEnabled();
        expect(screen.getByRole("region", { name: "本月扣款清單" })).toHaveTextContent("Netflix");
        expect(screen.getByText("共 1 次扣款，來自 1 個項目")).toBeInTheDocument();
      },
    },
    {
      name: "jumping back returns to the current month",
      status: "ready",
      items: [netflix],
      act: () => {
        fireEvent.click(screen.getByRole("button", { name: "下個月" }));
        fireEvent.click(screen.getByRole("button", { name: "回到本月" }));
      },
      expectDom: () => {
        expect(screen.getByRole("heading", { name: "2026 年 10 月" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "回到本月" })).toBeDisabled();
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onRetry = vi.fn();
      useYearRates.mockReturnValue(tt.rates ?? null);
      render(<CalendarSection items={tt.items} status={tt.status} loadError="連不上伺服器" onRetry={onRetry} />);

      tt.act?.();

      tt.expectDom();
      expect(onRetry).toHaveBeenCalledTimes(tt.expectedRetries ?? 0);
      if (tt.expectedRateRequest) expect(useYearRates).toHaveBeenLastCalledWith(...tt.expectedRateRequest);
    });
  }
});
