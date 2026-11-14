import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LoadStatus } from "@/hooks/useApiResource";
import { makeCategory, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { SubscriptionList } from "./SubscriptionList";

const music = makeCategory({ id: 1, name: "音樂", icon: null, sortOrder: 10 });
const items = [
  makeSubscription({ id: 1, name: "Netflix" }),
  makeSubscription({ id: 2, name: "Spotify", category: music }),
  makeSubscription({ id: 3, name: "Disney+" }),
];
// An end date long past and a pause wide enough to cover any day the tests run on.
const withPauses = [
  items[0],
  { ...items[1], contractEndDate: "2000-01-31" },
  { ...items[2], pauses: [{ id: 2, startDate: "2000-01-01", endDate: "2999-12-31" }] },
];

describe("SubscriptionList", () => {
  const tests: {
    name: string;
    status: LoadStatus;
    items: SubscriptionDto[];
    loadError?: string;
    click?: string;
    expectDom: () => void;
    /** `args` is omitted for handlers wired straight to onClick, which receive the click event. */
    expectedHandler?: { name: "onRetry" | "onAdd" | "onEdit" | "onDelete"; args?: unknown[] };
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
      expectedHandler: { name: "onRetry" },
    },
    {
      name: "no items shows the empty state, which adds",
      status: "ready",
      items: [],
      click: "新增第一筆扣款",
      expectDom: () => expect(screen.getByText("還沒有任何定期扣款")).toBeInTheDocument(),
      expectedHandler: { name: "onAdd" },
    },
    {
      name: "groups cards under category headings in category order",
      status: "ready",
      items,
      expectDom: () => {
        expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["音樂", "🎬影音串流"]);
        const video = screen.getByRole("region", { name: "影音串流" });
        expect(
          within(video)
            .getAllByRole("heading", { level: 4 })
            .map((h) => h.textContent),
        ).toEqual(["Disney+", "Netflix"]);
      },
    },
    {
      name: "gathers paused and ended items in a last section showing their status and category",
      status: "ready",
      items: withPauses,
      expectDom: () => {
        expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
          "🎬影音串流",
          "已暫停／已到期",
        ]);
        expect(
          within(screen.getByRole("region", { name: "影音串流" }))
            .getAllByRole("heading", { level: 4 })
            .map((h) => h.textContent),
        ).toEqual(["Netflix"]);
        const paused = screen.getByRole("region", { name: "已暫停／已到期" });
        const cards = within(paused).getAllByRole("article");
        expect(cards.map((card) => within(card).getByRole("heading", { level: 4 }).textContent)).toEqual([
          "Disney+",
          "Spotify",
        ]);
        expect(cards[0]).toHaveTextContent("暫停中・至 2999/12/31");
        expect(cards[0]).toHaveTextContent("影音串流");
        expect(cards[1]).toHaveTextContent("已到期・2000/01/31");
        expect(cards[1]).toHaveTextContent("音樂");
      },
    },
    {
      name: "a paused card's buttons still edit that item",
      status: "ready",
      items: withPauses,
      click: "編輯「Spotify」",
      expectDom: () => expect(screen.getByRole("region", { name: "已暫停／已到期" })).toBeInTheDocument(),
      expectedHandler: { name: "onEdit", args: [withPauses[1]] },
    },
    {
      name: "a card's edit button edits that item",
      status: "ready",
      items,
      click: "編輯「Spotify」",
      expectDom: () => expect(screen.getByRole("region", { name: "音樂" })).toBeInTheDocument(),
      expectedHandler: { name: "onEdit", args: [items[1]] },
    },
    {
      name: "a card's delete button deletes that item",
      status: "ready",
      items,
      click: "刪除「Netflix」",
      expectDom: () => expect(screen.getAllByRole("article")).toHaveLength(3),
      expectedHandler: { name: "onDelete", args: [items[0]] },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const handlers = { onRetry: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
      render(
        <SubscriptionList
          items={tt.items}
          status={tt.status}
          loadError={tt.loadError ?? null}
          {...handlers}
          remindersActive
        />,
      );

      if (tt.click) fireEvent.click(screen.getByRole("button", { name: tt.click }));

      tt.expectDom();
      for (const [name, handler] of Object.entries(handlers)) {
        if (tt.expectedHandler?.name !== name) expect(handler).not.toHaveBeenCalled();
        else if (tt.expectedHandler.args) expect(handler).toHaveBeenCalledWith(...tt.expectedHandler.args);
        else expect(handler).toHaveBeenCalledTimes(1);
      }
    });
  }
});
