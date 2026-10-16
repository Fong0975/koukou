import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PaymentMethodDto } from "@/types/dto";
import { flushPromises } from "@/test/async";
import { makePaymentMethod } from "@/test/fixtures";
import { PaymentMethodQuickAdd } from "./PaymentMethodQuickAdd";

describe("PaymentMethodQuickAdd", () => {
  const tests: {
    name: string;
    type?: string;
    onCreate: () => Promise<PaymentMethodDto>;
    act: () => void;
    expectedPlaceholder: RegExp;
    expectedPayload?: unknown;
    expectedDone: unknown[][];
  }[] = [
    {
      name: "defaults to credit card and selects the new method",
      onCreate: () => Promise.resolve(makePaymentMethod({ id: 7 })),
      act: () => fireEvent.click(screen.getByRole("button", { name: "加入" })),
      expectedPlaceholder: /^卡片名稱/,
      expectedPayload: { type: "CREDIT_CARD", name: "我的付款" },
      expectedDone: [["7"]],
    },
    {
      name: "bank account changes the hint and payload; Enter saves",
      type: "BANK_ACCOUNT",
      onCreate: () => Promise.resolve(makePaymentMethod({ id: 8, type: "BANK_ACCOUNT" })),
      act: () => fireEvent.keyDown(screen.getByLabelText("卡片或帳戶名稱"), { key: "Enter" }),
      expectedPlaceholder: /^帳戶名稱/,
      expectedPayload: { type: "BANK_ACCOUNT", name: "我的付款" },
      expectedDone: [["8"]],
    },
    {
      name: "stays open when creating fails",
      onCreate: () => Promise.reject(new Error("名稱重複")),
      act: () => fireEvent.click(screen.getByRole("button", { name: "加入" })),
      expectedPlaceholder: /^卡片名稱/,
      expectedPayload: { type: "CREDIT_CARD", name: "我的付款" },
      expectedDone: [],
    },
    {
      name: "cancel closes without a value",
      onCreate: () => Promise.resolve(makePaymentMethod()),
      act: () => fireEvent.click(screen.getByRole("button", { name: "取消" })),
      expectedPlaceholder: /^卡片名稱/,
      expectedDone: [[]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onCreate = vi.fn(tt.onCreate);
      const onDone = vi.fn();
      render(<PaymentMethodQuickAdd onCreate={onCreate} onDone={onDone} />);

      if (tt.type) fireEvent.change(screen.getByLabelText("扣款方式種類"), { target: { value: tt.type } });
      const nameInput = screen.getByLabelText("卡片或帳戶名稱");
      fireEvent.change(nameInput, { target: { value: "我的付款" } });
      await act(async () => {
        tt.act();
        await flushPromises();
      });

      expect(nameInput.getAttribute("placeholder")).toMatch(tt.expectedPlaceholder);
      if (tt.expectedPayload) expect(onCreate).toHaveBeenCalledWith(tt.expectedPayload);
      else expect(onCreate).not.toHaveBeenCalled();
      expect(onDone.mock.calls).toEqual(tt.expectedDone);
    });
  }
});
