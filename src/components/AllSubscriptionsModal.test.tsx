import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { AllSubscriptionsModal } from "./AllSubscriptionsModal";

const items = [makeSubscription({ id: 1, name: "Netflix" })];

// List states and card actions are covered by SubscriptionList's tests; this checks the dialog around them.
describe("AllSubscriptionsModal", () => {
  const tests: {
    name: string;
    items: SubscriptionDto[];
    click?: string;
    expectedToolbarAdd: boolean;
    expectedHandler?: "onAdd" | "onClose";
  }[] = [
    { name: "shows the list inside a titled dialog", items, expectedToolbarAdd: true },
    { name: "the toolbar button adds", items, click: "新增扣款", expectedToolbarAdd: true, expectedHandler: "onAdd" },
    { name: "the close button closes", items, click: "關閉", expectedToolbarAdd: true, expectedHandler: "onClose" },
    { name: "an empty list relies on the empty state's add button", items: [], expectedToolbarAdd: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const handlers = { onRetry: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() };
      render(<AllSubscriptionsModal items={tt.items} status="ready" loadError={null} {...handlers} />);

      const dialog = screen.getByRole("dialog", { name: "所有扣款" });
      if (tt.click) fireEvent.click(within(dialog).getByRole("button", { name: tt.click }));

      expect(within(dialog).queryByRole("button", { name: "新增扣款" }) !== null).toBe(tt.expectedToolbarAdd);
      for (const item of tt.items) expect(within(dialog).getByText(item.name)).toBeInTheDocument();
      expect(handlers.onAdd).toHaveBeenCalledTimes(tt.expectedHandler === "onAdd" ? 1 : 0);
      expect(handlers.onClose).toHaveBeenCalledTimes(tt.expectedHandler === "onClose" ? 1 : 0);
    });
  }
});
