import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { SubscriptionCard } from "./SubscriptionCard";

const item = makeSubscription({
  schedules: [
    { id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null },
    { id: 11, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null },
  ],
});

describe("SubscriptionCard", () => {
  const tests: {
    name: string;
    item: SubscriptionDto;
    texts: string[];
    absentTexts?: string[];
    schedules: string[];
  }[] = [
    {
      name: "renders name, amount, schedules and card",
      item,
      texts: ["Netflix", "NT$", "390", "信用卡", "國泰 CUBE"],
      schedules: ["每月 1 日", "每月 15 日"],
    },
    {
      name: "renders USD with cents, bank account and note",
      item: {
        ...item,
        currency: "USD",
        amount: "15.49",
        note: "家庭方案",
        paymentMethod: { id: 4, type: "BANK_ACCOUNT", name: "台新 Richart", note: null },
        schedules: [{ id: 12, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 1, month: 3 }],
      },
      texts: ["US$", "15.49", "帳戶扣款", "台新 Richart", "家庭方案"],
      absentTexts: ["NT$"],
      schedules: ["每年 3 月 1 日"],
    },
    {
      name: "renders the contract end date",
      item: { ...item, contractEndDate: "2099-12-31" },
      texts: ["2099/12/31"],
      schedules: ["每月 1 日", "每月 15 日"],
    },
    {
      name: "leaves out the contract note without an end date",
      item,
      texts: ["Netflix"],
      absentTexts: ["合約到期"],
      schedules: ["每月 1 日", "每月 15 日"],
    },
    {
      // The category is shown by the list's group heading instead.
      name: "leaves out the category",
      item,
      texts: ["Netflix"],
      absentTexts: ["影音串流", "🎬"],
      schedules: ["每月 1 日", "每月 15 日"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<SubscriptionCard item={tt.item} onEdit={vi.fn()} onDelete={vi.fn()} />);

      for (const text of tt.texts) expect(screen.getByText(text)).toBeInTheDocument();
      for (const text of tt.absentTexts ?? []) expect(screen.queryByText(text)).not.toBeInTheDocument();
      const list = screen.getByRole("list", { name: "扣款日" });
      expect(
        within(list)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.schedules);
    });
  }

  const actionTests = [
    { name: "edit button calls onEdit", label: "編輯「Netflix」", handler: "onEdit" },
    { name: "delete button calls onDelete", label: "刪除「Netflix」", handler: "onDelete" },
  ] as const;

  for (const tt of actionTests) {
    it(tt.name, () => {
      const handlers = { onEdit: vi.fn(), onDelete: vi.fn() };
      render(<SubscriptionCard item={item} {...handlers} />);

      fireEvent.click(screen.getByRole("button", { name: tt.label }));

      expect(handlers[tt.handler]).toHaveBeenCalledWith(item);
      const other = tt.handler === "onEdit" ? handlers.onDelete : handlers.onEdit;
      expect(other).not.toHaveBeenCalled();
    });
  }
});
