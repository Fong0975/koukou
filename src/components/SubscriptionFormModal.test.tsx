import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { todayKey } from "@/lib/dateKey";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { flushPromises } from "@/test/async";
import { makeCategory, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { SubscriptionFormModal } from "./SubscriptionFormModal";

const categories = [makeCategory({ id: 2 }), makeCategory({ id: 5, name: "電信", icon: null })];
const paymentMethods = [makePaymentMethod({ id: 3 })];

/** Fills every required field of an empty form, paying in USD. */
function fillForm() {
  fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Spotify" } });
  fireEvent.change(screen.getByLabelText("類型"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("radio", { name: "美金" }));
  fireEvent.change(screen.getByRole("textbox", { name: "金額" }), { target: { value: "10.99" } });
  fireEvent.change(screen.getByLabelText("扣款方式"), { target: { value: "3" } });
}

const filledInput: SubscriptionInput = {
  name: "Spotify",
  categoryId: "5",
  paymentMethodId: "3",
  currency: "USD",
  amount: "10.99",
  startDate: todayKey(),
  amountPeriods: [],
  note: "",
  schedules: [{ cycle: "MONTHLY", dayOfMonth: "1" }],
};

describe("SubscriptionFormModal", () => {
  const tests: {
    name: string;
    initial?: SubscriptionDto;
    onSubmit?: () => Promise<unknown>;
    fill?: boolean;
    click: string;
    expectedTitle: string;
    expectedInput?: SubscriptionInput;
    expectedCloses: number;
    expectedFieldError?: string;
    expectedAlert?: string;
  }[] = [
    {
      name: "adding submits the filled values and closes",
      fill: true,
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: filledInput,
      expectedCloses: 1,
    },
    {
      name: "editing starts from the item and saves it unchanged",
      initial: makeSubscription({ note: "家庭方案" }),
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedInput: {
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "TWD",
        amount: "390",
        startDate: "2026-01-01",
        amountPeriods: [],
        note: "家庭方案",
        schedules: [{ cycle: "MONTHLY", dayOfMonth: "1" }],
      },
      expectedCloses: 1,
    },
    {
      name: "invalid input is caught before submitting",
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedCloses: 0,
      expectedFieldError: "請輸入項目名稱",
    },
    {
      name: "server field errors are shown on the field",
      onSubmit: () =>
        Promise.reject(
          new ApiClientError("資料驗證失敗", 400, "VALIDATION_ERROR", [{ path: "name", message: "名稱已存在" }]),
        ),
      fill: true,
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: filledInput,
      expectedCloses: 0,
      expectedFieldError: "名稱已存在",
    },
    {
      name: "other server errors are shown for the whole form",
      onSubmit: () => Promise.reject(new Error("連不上伺服器")),
      fill: true,
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: filledInput,
      expectedCloses: 0,
      expectedAlert: "連不上伺服器",
    },
    {
      name: "cancel closes without submitting",
      fill: true,
      click: "取消",
      expectedTitle: "新增扣款",
      expectedCloses: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onSubmit = vi.fn(tt.onSubmit ?? (() => Promise.resolve()));
      const onClose = vi.fn();
      render(
        <SubscriptionFormModal
          initial={tt.initial}
          categories={categories}
          paymentMethods={paymentMethods}
          onAddCategory={vi.fn()}
          onAddPaymentMethod={vi.fn()}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      );
      expect(screen.getByRole("dialog", { name: tt.expectedTitle })).toBeInTheDocument();

      if (tt.fill) fillForm();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: tt.click }));
        await flushPromises();
      });

      if (tt.expectedInput) expect(onSubmit).toHaveBeenCalledWith(tt.expectedInput);
      else expect(onSubmit).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      if (tt.expectedFieldError) {
        expect(screen.getByText(tt.expectedFieldError)).toBeInTheDocument();
        expect(screen.getByLabelText("名稱")).toHaveAttribute("aria-invalid", "true");
      }
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});
