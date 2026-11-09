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
    expectedHandler?: "onAdd" | "onClose" | "onManageCategories" | "onManagePaymentMethods";
  }[] = [
    {
      name: "the payment method button opens its manager",
      items,
      click: "管理扣款方式",
      expectedToolbarAdd: true,
      expectedHandler: "onManagePaymentMethods",
    },
    {
      name: "the payment method button is available even when the list is empty",
      items: [],
      click: "管理扣款方式",
      expectedToolbarAdd: false,
      expectedHandler: "onManagePaymentMethods",
    },
    { name: "shows the list inside a titled dialog", items, expectedToolbarAdd: true },
    {
      name: "the category button opens the manager",
      items,
      click: "管理類型",
      expectedToolbarAdd: true,
      expectedHandler: "onManageCategories",
    },
    {
      name: "the category button is available even when the list is empty",
      items: [],
      click: "管理類型",
      expectedToolbarAdd: false,
      expectedHandler: "onManageCategories",
    },
    { name: "the toolbar button adds", items, click: "新增扣款", expectedToolbarAdd: true, expectedHandler: "onAdd" },
    { name: "the close button closes", items, click: "關閉", expectedToolbarAdd: true, expectedHandler: "onClose" },
    { name: "an empty list relies on the empty state's add button", items: [], expectedToolbarAdd: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const handlers = {
        onRetry: vi.fn(),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onManageCategories: vi.fn(),
        onManagePaymentMethods: vi.fn(),
        onClose: vi.fn(),
      };
      render(<AllSubscriptionsModal items={tt.items} status="ready" loadError={null} {...handlers} remindersActive />);

      const dialog = screen.getByRole("dialog", { name: "所有扣款" });
      expect(within(dialog).getByRole("heading", { level: 2, name: "所有扣款" })).toHaveClass("font-semibold");
      if (tt.click) fireEvent.click(within(dialog).getByRole("button", { name: tt.click }));

      expect(within(dialog).queryByRole("button", { name: "新增扣款" }) !== null).toBe(tt.expectedToolbarAdd);
      for (const item of tt.items) expect(within(dialog).getByText(item.name)).toBeInTheDocument();
      expect(handlers.onAdd).toHaveBeenCalledTimes(tt.expectedHandler === "onAdd" ? 1 : 0);
      expect(handlers.onClose).toHaveBeenCalledTimes(tt.expectedHandler === "onClose" ? 1 : 0);
      expect(handlers.onManageCategories).toHaveBeenCalledTimes(tt.expectedHandler === "onManageCategories" ? 1 : 0);
      expect(handlers.onManagePaymentMethods).toHaveBeenCalledTimes(
        tt.expectedHandler === "onManagePaymentMethods" ? 1 : 0,
      );
    });
  }
});
