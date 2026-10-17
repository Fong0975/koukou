import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newAmountPeriodDraft, type AmountPeriodDraft, type FieldErrors } from "@/lib/subscriptionDraft";
import { AmountSection, type AmountFields } from "./AmountSection";

describe("AmountSection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 17, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const past = newAmountPeriodDraft({ amount: "100", endDate: "2026-03-20" });

  const tests: {
    name: string;
    amountPeriods?: AmountPeriodDraft[];
    errors?: FieldErrors;
    act?: () => void;
    expectedPatch?: (patch: Partial<AmountFields>) => void;
    expectDom?: () => void;
  }[] = [
    {
      name: "without past amounts shows no history or start note",
      expectDom: () => {
        expect(screen.queryByRole("list", { name: "歷史金額" })).not.toBeInTheDocument();
        expect(screen.queryByText(/起適用/)).not.toBeInTheDocument();
      },
    },
    {
      name: "with past amounts says when the current amount starts",
      amountPeriods: [past],
      expectDom: () => {
        expect(screen.getByRole("list", { name: "歷史金額" })).toBeInTheDocument();
        expect(screen.getByText(/起適用/)).toHaveTextContent("目前金額自 2026-03-21 起適用");
      },
    },
    {
      name: "choosing a currency patches it",
      act: () => fireEvent.click(screen.getByRole("radio", { name: "美金" })),
      expectedPatch: (patch) => expect(patch).toEqual({ currency: "USD" }),
    },
    {
      name: "typing the current amount patches it",
      act: () => fireEvent.change(screen.getByRole("textbox", { name: "金額" }), { target: { value: "420" } }),
      expectedPatch: (patch) => expect(patch).toEqual({ amount: "420" }),
    },
    {
      name: "adding a record copies the current amount and ends today",
      amountPeriods: [past],
      act: () => fireEvent.click(screen.getByRole("button", { name: "新增金額紀錄" })),
      expectedPatch: (patch) => {
        expect(patch.amountPeriods).toHaveLength(2);
        expect(patch.amountPeriods?.[0]).toBe(past);
        expect(patch.amountPeriods?.[1]).toMatchObject({ amount: "390", endDate: "2026-10-17" });
      },
    },
    {
      name: "editing a past amount patches the list",
      amountPeriods: [past],
      act: () => fireEvent.change(screen.getByLabelText("第 1 筆歷史金額的金額"), { target: { value: "110" } }),
      expectedPatch: (patch) =>
        expect(patch.amountPeriods?.[0]).toMatchObject({ amount: "110", endDate: "2026-03-20" }),
    },
    {
      name: "shows the current amount error",
      errors: { amount: "請輸入金額" },
      expectDom: () => {
        expect(screen.getByText("請輸入金額")).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: "金額" })).toHaveAttribute("aria-invalid", "true");
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <AmountSection
          currency="TWD"
          amount="390"
          amountPeriods={tt.amountPeriods ?? []}
          startDate="2026-01-01"
          onChange={onChange}
          errors={tt.errors ?? {}}
        />,
      );

      tt.act?.();

      tt.expectDom?.();
      if (tt.expectedPatch) {
        expect(onChange).toHaveBeenCalledTimes(1);
        tt.expectedPatch(onChange.mock.calls[0][0]);
      } else {
        expect(onChange).not.toHaveBeenCalled();
      }
    });
  }
});
