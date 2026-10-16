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
        expect(screen.getByRole("cell", { name: "5 日" })).toBeInTheDocument();
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
