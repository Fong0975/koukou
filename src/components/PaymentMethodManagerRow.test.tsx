import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PaymentMethodDto } from "@/types/dto";
import { makePaymentMethod } from "@/test/fixtures";
import { PaymentMethodManagerRow } from "./PaymentMethodManagerRow";

type Handler = "onMoveUp" | "onMoveDown" | "onEdit" | "onDelete";

describe("PaymentMethodManagerRow", () => {
  const cube = makePaymentMethod({ name: "國泰 CUBE", note: null });
  const tests: {
    name: string;
    paymentMethod: PaymentMethodDto;
    inUse: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    click?: { label: string; handler: Handler };
    openNote?: boolean;
    expectedNoteIcon: boolean;
    expectedNoteShown?: boolean;
    expectedDeleteDisabled: boolean;
  }[] = [
    {
      name: "shows the name without a note icon, and delete works when unused",
      paymentMethod: cube,
      inUse: false,
      click: { label: "刪除「國泰 CUBE」", handler: "onDelete" },
      expectedNoteIcon: false,
      expectedDeleteDisabled: false,
    },
    {
      name: "a note is hidden behind an info icon until it is opened",
      paymentMethod: makePaymentMethod({ name: "國泰 CUBE", note: "主力卡" }),
      inUse: false,
      expectedNoteIcon: true,
      expectedDeleteDisabled: false,
    },
    {
      name: "tapping the info icon shows the note",
      paymentMethod: makePaymentMethod({ name: "國泰 CUBE", note: "主力卡" }),
      inUse: false,
      openNote: true,
      expectedNoteIcon: true,
      expectedNoteShown: true,
      expectedDeleteDisabled: false,
    },
    {
      name: "a payment method in use is badged and cannot be deleted but can be edited",
      paymentMethod: makePaymentMethod({ type: "BANK_ACCOUNT", name: "台新 Richart", note: null }),
      inUse: true,
      click: { label: "編輯「台新 Richart」", handler: "onEdit" },
      expectedNoteIcon: false,
      expectedDeleteDisabled: true,
    },
    {
      name: "moving down calls onMoveDown",
      paymentMethod: cube,
      inUse: false,
      canMoveUp: true,
      canMoveDown: true,
      click: { label: "下移「國泰 CUBE」", handler: "onMoveDown" },
      expectedNoteIcon: false,
      expectedDeleteDisabled: false,
    },
    {
      name: "moving up calls onMoveUp",
      paymentMethod: cube,
      inUse: false,
      canMoveUp: true,
      canMoveDown: false,
      click: { label: "上移「國泰 CUBE」", handler: "onMoveUp" },
      expectedNoteIcon: false,
      expectedDeleteDisabled: false,
    },
    {
      name: "a disabled move button does nothing",
      paymentMethod: cube,
      inUse: false,
      canMoveUp: false,
      canMoveDown: true,
      click: { label: "上移「國泰 CUBE」", handler: "onMoveUp" },
      expectedNoteIcon: false,
      expectedDeleteDisabled: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const handlers = { onMoveUp: vi.fn(), onMoveDown: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
      render(
        <PaymentMethodManagerRow
          paymentMethod={tt.paymentMethod}
          inUse={tt.inUse}
          canMoveUp={tt.canMoveUp ?? false}
          canMoveDown={tt.canMoveDown ?? false}
          {...handlers}
        />,
      );
      const { name, note } = tt.paymentMethod;

      const noteTrigger = screen.queryByRole("button", { name: `${name} 的備註` });
      if (tt.openNote && noteTrigger) fireEvent.click(noteTrigger);
      const clicked = tt.click ? screen.getByRole<HTMLButtonElement>("button", { name: tt.click.label }) : null;
      if (clicked) fireEvent.click(clicked);

      expect(screen.getByText(name)).toBeInTheDocument();
      expect(noteTrigger !== null).toBe(tt.expectedNoteIcon);
      if (note) expect(screen.queryByText(note) !== null).toBe(Boolean(tt.expectedNoteShown));
      expect(screen.queryByText("使用中") !== null).toBe(tt.inUse);
      expect(screen.getByRole("button", { name: `刪除「${name}」` })).toHaveProperty(
        "disabled",
        tt.expectedDeleteDisabled,
      );
      expect(screen.getByRole("button", { name: `上移「${name}」` })).toHaveProperty("disabled", !tt.canMoveUp);
      expect(screen.getByRole("button", { name: `下移「${name}」` })).toHaveProperty("disabled", !tt.canMoveDown);
      for (const handler of Object.keys(handlers) as Handler[]) {
        const expected = clicked && !clicked.disabled && tt.click?.handler === handler ? 1 : 0;
        expect(handlers[handler]).toHaveBeenCalledTimes(expected);
      }
    });
  }
});
