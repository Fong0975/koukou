import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LoadStatus } from "@/hooks/useSubscriptions";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { SubscriptionGrid } from "./SubscriptionGrid";

const items = [makeSubscription({ id: 1, name: "Netflix" }), makeSubscription({ id: 2, name: "Spotify" })];

describe("SubscriptionGrid", () => {
  const tests: {
    name: string;
    status: LoadStatus;
    items: SubscriptionDto[];
    loadError?: string;
    click?: string;
    expectDom: () => void;
    expectedHandler?: "onRetry" | "onAdd";
  }[] = [
    {
      name: "first load shows placeholders",
      status: "loading",
      items: [],
      expectDom: () => expect(screen.getByLabelText("讀取中")).toHaveAttribute("aria-busy", "true"),
    },
    {
      name: "reloading keeps showing the current cards",
      status: "loading",
      items,
      expectDom: () => {
        expect(screen.queryByLabelText("讀取中")).not.toBeInTheDocument();
        expect(screen.getByText("Netflix")).toBeInTheDocument();
      },
    },
    {
      name: "load error shows the reason and retries",
      status: "error",
      items: [],
      loadError: "連不上伺服器",
      click: "重新讀取",
      expectDom: () => expect(screen.getByRole("alert")).toHaveTextContent("連不上伺服器"),
      expectedHandler: "onRetry",
    },
    {
      name: "no items shows the empty state, which adds",
      status: "ready",
      items: [],
      click: "新增第一筆扣款",
      expectDom: () => expect(screen.getByText("還沒有任何定期扣款")).toBeInTheDocument(),
      expectedHandler: "onAdd",
    },
    {
      name: "ready renders one card per item",
      status: "ready",
      items,
      expectDom: () => expect(screen.getAllByRole("button", { name: /^編輯/ })).toHaveLength(2),
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const handlers = { onRetry: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
      render(<SubscriptionGrid items={tt.items} status={tt.status} loadError={tt.loadError ?? null} {...handlers} />);

      if (tt.click) fireEvent.click(screen.getByRole("button", { name: tt.click }));

      tt.expectDom();
      expect(handlers.onRetry).toHaveBeenCalledTimes(tt.expectedHandler === "onRetry" ? 1 : 0);
      expect(handlers.onAdd).toHaveBeenCalledTimes(tt.expectedHandler === "onAdd" ? 1 : 0);
    });
  }
});
