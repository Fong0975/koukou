import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PaymentMethodDto } from "@/types/dto";
import { flushPromises } from "@/test/async";
import { makePaymentMethod } from "@/test/fixtures";
import { runUnsavedChangesCases } from "@/test/unsavedChanges";
import { PaymentMethodEditForm } from "./PaymentMethodEditForm";

describe("PaymentMethodEditForm", () => {
  const original = makePaymentMethod({ id: 7, type: "CREDIT_CARD", name: "國泰 CUBE", note: "主力卡" });
  const tests: {
    name: string;
    paymentMethod: PaymentMethodDto;
    edit?: () => void;
    onSave: () => Promise<PaymentMethodDto>;
    act: () => void;
    expectedPayload?: unknown[];
    expectedDone: number;
    expectedAlert?: string;
  }[] = [
    {
      name: "saves unchanged values so the note is kept",
      paymentMethod: original,
      onSave: () => Promise.resolve(original),
      act: () => fireEvent.click(screen.getByRole("button", { name: "儲存" })),
      expectedPayload: [7, { type: "CREDIT_CARD", name: "國泰 CUBE", note: "主力卡" }],
      expectedDone: 1,
    },
    {
      name: "saves an edited type, name and note",
      paymentMethod: original,
      edit: () => {
        fireEvent.change(screen.getByLabelText("扣款方式種類"), { target: { value: "BANK_ACCOUNT" } });
        fireEvent.change(screen.getByLabelText("卡片或帳戶名稱"), { target: { value: "台新 Richart" } });
        fireEvent.change(screen.getByLabelText("備註（可留空）"), { target: { value: "薪轉" } });
      },
      onSave: () => Promise.resolve(original),
      act: () => fireEvent.click(screen.getByRole("button", { name: "儲存" })),
      expectedPayload: [7, { type: "BANK_ACCOUNT", name: "台新 Richart", note: "薪轉" }],
      expectedDone: 1,
    },
    {
      name: "a payment method without a note starts with an empty note",
      paymentMethod: makePaymentMethod({ id: 7, note: null }),
      onSave: () => Promise.resolve(original),
      act: () => fireEvent.click(screen.getByRole("button", { name: "儲存" })),
      expectedPayload: [7, { type: "CREDIT_CARD", name: "國泰 CUBE", note: "" }],
      expectedDone: 1,
    },
    {
      name: "Enter in the note input also saves",
      paymentMethod: original,
      onSave: () => Promise.resolve(original),
      act: () => fireEvent.keyDown(screen.getByLabelText("備註（可留空）"), { key: "Enter" }),
      expectedPayload: [7, { type: "CREDIT_CARD", name: "國泰 CUBE", note: "主力卡" }],
      expectedDone: 1,
    },
    {
      name: "stays open and shows why when saving fails",
      paymentMethod: original,
      onSave: () => Promise.reject(new Error("扣款方式「國泰 CUBE」已存在")),
      act: () => fireEvent.click(screen.getByRole("button", { name: "儲存" })),
      expectedPayload: [7, { type: "CREDIT_CARD", name: "國泰 CUBE", note: "主力卡" }],
      expectedDone: 0,
      expectedAlert: "扣款方式「國泰 CUBE」已存在",
    },
    {
      name: "cancel closes without saving",
      paymentMethod: original,
      onSave: () => Promise.resolve(original),
      act: () => fireEvent.click(screen.getByRole("button", { name: "取消" })),
      expectedDone: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onSave = vi.fn(tt.onSave);
      const onDone = vi.fn();
      render(<PaymentMethodEditForm paymentMethod={tt.paymentMethod} onSave={onSave} onDone={onDone} />);
      expect(screen.getByLabelText("扣款方式種類")).toHaveValue(tt.paymentMethod.type);
      expect(screen.getByLabelText("卡片或帳戶名稱")).toHaveValue(tt.paymentMethod.name);
      expect(screen.getByLabelText("備註（可留空）")).toHaveValue(tt.paymentMethod.note ?? "");

      tt.edit?.();
      tt.act();
      await act(flushPromises);

      if (tt.expectedPayload) expect(onSave).toHaveBeenCalledWith(...tt.expectedPayload);
      else expect(onSave).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(tt.expectedDone);
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});

describe("PaymentMethodEditForm unsaved changes", () => {
  const typeNote = (value: string) => fireEvent.change(screen.getByLabelText("備註（可留空）"), { target: { value } });

  runUnsavedChangesCases(
    () => (
      <PaymentMethodEditForm
        paymentMethod={makePaymentMethod({ id: 7, type: "CREDIT_CARD", name: "國泰 CUBE", note: "主力卡" })}
        onSave={vi.fn()}
        onDone={vi.fn()}
      />
    ),
    [
      { name: "unchanged values close without asking", expectedConfirm: false },
      {
        name: "a changed type asks first",
        edit: () => fireEvent.change(screen.getByLabelText("扣款方式種類"), { target: { value: "BANK_ACCOUNT" } }),
        expectedConfirm: true,
      },
      {
        name: "an edited name asks first",
        edit: () => fireEvent.change(screen.getByLabelText("卡片或帳戶名稱"), { target: { value: "台新 Richart" } }),
        expectedConfirm: true,
      },
      { name: "an edited note asks first", edit: () => typeNote("薪轉"), expectedConfirm: true },
      {
        name: "a note edited back to the original closes without asking",
        edit: () => {
          typeNote("薪轉");
          typeNote("主力卡");
        },
        expectedConfirm: false,
      },
    ],
  );
});
