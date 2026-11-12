import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { todayKey } from "@/lib/dateKey";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { flushPromises } from "@/test/async";
import { makeCategory, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import { clickCloseButton, isConfirmCloseShown } from "@/test/unsavedChanges";
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

const noReminders = { chargeDaysBefore: [], expiryDaysBefore: [] };

const filledInput: SubscriptionInput = {
  name: "Spotify",
  categoryId: "5",
  paymentMethodId: "3",
  currency: "USD",
  amount: "10.99",
  amortize: false,
  startDate: todayKey(),
  contractEndDate: "",
  amountPeriods: [],
  note: "",
  schedules: [{ cycle: "MONTHLY", dayOfMonth: "1" }],
  reminders: noReminders,
};

describe("SubscriptionFormModal", () => {
  const tests: {
    name: string;
    initial?: SubscriptionDto;
    onSubmit?: () => Promise<unknown>;
    fill?: boolean;
    /** Extra interaction after filling and before clicking. */
    act?: () => void;
    click: string;
    /** Whether LINE reminders go out; defaults to true. */
    remindersActive?: boolean;
    expectedTitle: string;
    expectedInput?: SubscriptionInput;
    expectedCloses: number;
    expectedFieldError?: string;
    /** Accessible name of the input expected to be marked invalid; defaults to "名稱". */
    expectedInvalidField?: string;
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
        amortize: false,
        startDate: "2026-01-01",
        contractEndDate: "",
        amountPeriods: [],
        note: "家庭方案",
        schedules: [{ cycle: "MONTHLY", dayOfMonth: "1" }],
        reminders: noReminders,
      },
      expectedCloses: 1,
    },
    {
      name: "editing keeps the start date and past amounts",
      initial: makeSubscription({
        startDate: "2026-01-15",
        amountPeriods: [{ id: 1, amount: "330.00", endDate: "2026-03-31" }],
      }),
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedInput: {
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "TWD",
        amount: "390",
        amortize: false,
        startDate: "2026-01-15",
        contractEndDate: "",
        amountPeriods: [{ amount: "330", endDate: "2026-03-31" }],
        note: "",
        schedules: [{ cycle: "MONTHLY", dayOfMonth: "1" }],
        reminders: noReminders,
      },
      expectedCloses: 1,
    },
    {
      name: "a new amount record keeps the old amount and the current one can change",
      fill: true,
      act: () => {
        fireEvent.change(screen.getByLabelText("起始日"), { target: { value: "2026-01-01" } });
        fireEvent.click(screen.getByRole("button", { name: "新增金額紀錄" }));
        fireEvent.change(screen.getByRole("textbox", { name: "金額" }), { target: { value: "12.99" } });
      },
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: {
        ...filledInput,
        amount: "12.99",
        startDate: "2026-01-01",
        amountPeriods: [{ amount: "10.99", endDate: todayKey() }],
      },
      expectedCloses: 1,
    },
    {
      name: "a yearly schedule shows the amortize toggle and submits it",
      fill: true,
      act: () => {
        expect(screen.queryByRole("checkbox", { name: "年繳金額均攤預留" })).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("第 1 個扣款日的週期"), { target: { value: "YEARLY" } });
        fireEvent.click(screen.getByRole("checkbox", { name: "年繳金額均攤預留" }));
      },
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: {
        ...filledInput,
        amortize: true,
        schedules: [{ cycle: "YEARLY", month: "1", dayOfMonth: "1" }],
        reminders: noReminders,
      },
      expectedCloses: 1,
    },
    {
      name: "removing the yearly schedule hides the toggle and turns amortize off",
      initial: makeSubscription({
        amortize: true,
        schedules: [{ id: 10, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 11, month: 10 }],
        reminders: noReminders,
      }),
      act: () => {
        expect(screen.getByRole("checkbox", { name: "年繳金額均攤預留" })).toBeChecked();
        fireEvent.change(screen.getByLabelText("第 1 個扣款日的週期"), { target: { value: "MONTHLY" } });
        expect(screen.queryByRole("checkbox", { name: "年繳金額均攤預留" })).not.toBeInTheDocument();
      },
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedInput: {
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "TWD",
        amount: "390",
        amortize: false,
        startDate: "2026-01-01",
        contractEndDate: "",
        amountPeriods: [],
        note: "",
        schedules: [{ cycle: "MONTHLY", dayOfMonth: "11" }],
        reminders: noReminders,
      },
      expectedCloses: 1,
    },
    {
      name: "a contract end date can be added and is submitted",
      fill: true,
      act: () => fireEvent.change(screen.getByLabelText("合約到期日（選填）"), { target: { value: "2099-12-31" } }),
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: { ...filledInput, contractEndDate: "2099-12-31" },
      expectedCloses: 1,
    },
    {
      name: "editing keeps the contract end date",
      initial: makeSubscription({ contractEndDate: "2027-03-31" }),
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedInput: {
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "TWD",
        amount: "390",
        amortize: false,
        startDate: "2026-01-01",
        contractEndDate: "2027-03-31",
        amountPeriods: [],
        note: "",
        schedules: [{ cycle: "MONTHLY", dayOfMonth: "1" }],
        reminders: noReminders,
      },
      expectedCloses: 1,
    },
    {
      name: "a contract end date before the start date is caught before submitting",
      initial: makeSubscription({ contractEndDate: "2025-12-31" }),
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedCloses: 0,
      expectedFieldError: "合約到期日不可早於起始日",
      expectedInvalidField: "合約到期日（選填）",
    },
    {
      name: "a past amount ending before the start date is caught before submitting",
      initial: makeSubscription({
        startDate: "2026-05-01",
        amountPeriods: [{ id: 1, amount: "330.00", endDate: "2026-03-31" }],
      }),
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedCloses: 0,
      expectedFieldError: "到期日不可早於起始日",
      expectedInvalidField: "第 1 筆歷史金額的到期日",
    },
    {
      name: "a cleared start date is caught before submitting",
      initial: makeSubscription(),
      act: () => fireEvent.change(screen.getByLabelText("起始日"), { target: { value: "" } }),
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedCloses: 0,
      expectedFieldError: "請輸入起始日",
      expectedInvalidField: "起始日",
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
      name: "charge reminders can be set for the charge day and days ahead",
      fill: true,
      act: () => {
        for (const value of ["0", "3"]) {
          fireEvent.change(screen.getByLabelText("提前"), { target: { value } });
          fireEvent.click(screen.getByRole("button", { name: "新增" }));
        }
      },
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: { ...filledInput, reminders: { chargeDaysBefore: [0, 3], expiryDaysBefore: [] } },
      expectedCloses: 1,
    },
    {
      name: "expiry reminders are offered once a contract end date is set",
      fill: true,
      act: () => {
        expect(screen.queryByRole("checkbox", { name: "到期前 7 天" })).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("合約到期日（選填）"), { target: { value: "2099-12-31" } });
        fireEvent.click(screen.getByRole("checkbox", { name: "到期前 7 天" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "到期當日" }));
      },
      click: "新增扣款",
      expectedTitle: "新增扣款",
      expectedInput: {
        ...filledInput,
        contractEndDate: "2099-12-31",
        reminders: { chargeDaysBefore: [], expiryDaysBefore: [0, 7] },
      },
      expectedCloses: 1,
    },
    {
      name: "clearing the contract end date drops the expiry reminders",
      initial: makeSubscription({
        contractEndDate: "2027-03-31",
        reminders: { chargeDaysBefore: [1], expiryDaysBefore: [7] },
      }),
      act: () => {
        expect(screen.getByRole("checkbox", { name: "到期前 7 天" })).toBeChecked();
        fireEvent.change(screen.getByLabelText("合約到期日（選填）"), { target: { value: "" } });
        expect(screen.queryByRole("checkbox", { name: "到期前 7 天" })).not.toBeInTheDocument();
      },
      click: "儲存變更",
      expectedTitle: "編輯扣款",
      expectedInput: {
        name: "Netflix",
        categoryId: "2",
        paymentMethodId: "3",
        currency: "TWD",
        amount: "390",
        amortize: false,
        startDate: "2026-01-01",
        contractEndDate: "",
        amountPeriods: [],
        note: "",
        schedules: [{ cycle: "MONTHLY", dayOfMonth: "1" }],
        reminders: { chargeDaysBefore: [1], expiryDaysBefore: [] },
      },
      expectedCloses: 1,
    },
    {
      name: "cancel closes without submitting",
      fill: true,
      click: "取消",
      expectedTitle: "新增扣款",
      expectedCloses: 1,
    },
    {
      name: "the reminder block is locked while LINE reminders are off",
      remindersActive: false,
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
          remindersActive={tt.remindersActive ?? true}
        />,
      );
      expect(screen.getByRole("dialog", { name: tt.expectedTitle })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: tt.expectedTitle })).toHaveClass("font-semibold");
      const remindersLocked = tt.remindersActive === false;
      expect(screen.getByLabelText("提前").matches(":disabled")).toBe(remindersLocked);

      if (tt.fill) fillForm();
      tt.act?.();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: tt.click }));
        await flushPromises();
      });

      if (tt.expectedInput) expect(onSubmit).toHaveBeenCalledWith(tt.expectedInput);
      else expect(onSubmit).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      if (tt.expectedFieldError) {
        expect(screen.getByText(tt.expectedFieldError)).toBeInTheDocument();
        expect(screen.getByLabelText(tt.expectedInvalidField ?? "名稱")).toHaveAttribute("aria-invalid", "true");
      }
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});

describe("SubscriptionFormModal unsaved changes", () => {
  const typeName = (value: string) => fireEvent.change(screen.getByLabelText("名稱"), { target: { value } });
  const tests: {
    name: string;
    initial?: SubscriptionDto;
    edit?: () => void;
    close: "x" | "取消";
    expectedConfirm: boolean;
  }[] = [
    { name: "an untouched new form closes without asking", close: "x", expectedConfirm: false },
    {
      name: "an untouched edit form closes without asking",
      initial: makeSubscription(),
      close: "x",
      expectedConfirm: false,
    },
    { name: "a typed name asks first", edit: () => typeName("Spotify"), close: "x", expectedConfirm: true },
    {
      name: "a name typed and cleared again closes without asking",
      edit: () => {
        typeName("Spotify");
        typeName("");
      },
      close: "x",
      expectedConfirm: false,
    },
    {
      name: "a name typed in the quick-add category form asks first",
      edit: () => {
        fireEvent.click(screen.getByRole("button", { name: "新增類型" }));
        fireEvent.change(screen.getByLabelText("新的類型名稱"), { target: { value: "健身房" } });
      },
      close: "x",
      expectedConfirm: true,
    },
    { name: "取消 closes without asking despite changes", edit: fillForm, close: "取消", expectedConfirm: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onClose = vi.fn();
      render(
        <SubscriptionFormModal
          initial={tt.initial}
          categories={categories}
          paymentMethods={paymentMethods}
          onAddCategory={vi.fn()}
          onAddPaymentMethod={vi.fn()}
          onSubmit={vi.fn()}
          onClose={onClose}
          remindersActive
        />,
      );
      const title = tt.initial ? "編輯扣款" : "新增扣款";

      tt.edit?.();
      if (tt.close === "x") clickCloseButton(title);
      else fireEvent.click(screen.getByRole("button", { name: "取消" }));

      expect(isConfirmCloseShown()).toBe(tt.expectedConfirm);
      expect(onClose).toHaveBeenCalledTimes(tt.expectedConfirm ? 0 : 1);
    });
  }
});
