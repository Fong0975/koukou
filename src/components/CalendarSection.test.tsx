import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoadStatus } from "@/hooks/useSubscriptions";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
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

describe("CalendarSection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 16, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tests: {
    name: string;
    status: LoadStatus;
    items: SubscriptionDto[];
    act?: () => void;
    expectDom: () => void;
    expectedRetries?: number;
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
      },
    },
    {
      name: "an amortized yearly charge saves for next year from its charge month",
      status: "ready",
      items: [domain],
      expectDom: () => {
        expect(screen.getByText("本月總計").nextElementSibling).toHaveTextContent("NT$ 1,000");
        expect(screen.getByRole("list", { name: "預扣款項" })).toHaveTextContent(
          "網域2027 年期（10/11 扣款）NT$ 84 (83.3)",
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
        expect(screen.getByRole("list", { name: "本月扣款" })).toHaveTextContent("Netflix");
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
      render(<CalendarSection items={tt.items} status={tt.status} loadError="連不上伺服器" onRetry={onRetry} />);

      tt.act?.();

      tt.expectDom();
      expect(onRetry).toHaveBeenCalledTimes(tt.expectedRetries ?? 0);
    });
  }
});
