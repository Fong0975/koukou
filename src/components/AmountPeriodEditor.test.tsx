import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { newAmountPeriodDraft, type AmountPeriodDraft, type FieldErrors } from "@/lib/subscriptionDraft";
import { AmountPeriodEditor } from "./AmountPeriodEditor";

const FIRST = "第 1 筆歷史金額";
const SECOND = "第 2 筆歷史金額";

describe("AmountPeriodEditor", () => {
  // Stored oldest-last on purpose: the editor must show newest first without reordering the data.
  const newer = newAmountPeriodDraft({ amount: "120", endDate: "2026-06-30" });
  const older = newAmountPeriodDraft({ amount: "100", endDate: "2026-03-20" });
  const periods = [newer, older];

  const tests: {
    name: string;
    periods: AmountPeriodDraft[];
    errors?: FieldErrors;
    act?: () => void;
    expectChange?: (next: AmountPeriodDraft[]) => void;
    expectDom?: () => void;
  }[] = [
    {
      name: "renders nothing without past amounts",
      periods: [],
      expectDom: () => expect(screen.queryByRole("list", { name: "歷史金額" })).not.toBeInTheDocument(),
    },
    {
      name: "lists rows newest first with the day each starts",
      periods,
      expectDom: () => {
        const rows = within(screen.getByRole("list", { name: "歷史金額" })).getAllByRole("listitem");
        expect(rows.map((row) => row.textContent)).toEqual(["2026-03-21 ～NT$", "2026-01-15 ～NT$"]);
        expect(screen.getByLabelText(`${FIRST}的到期日`)).toHaveValue("2026-06-30");
        expect(screen.getByLabelText(`${FIRST}的金額`)).toHaveValue("120");
        expect(screen.getByLabelText(`${SECOND}的到期日`)).toHaveValue("2026-03-20");
        expect(screen.getByLabelText(`${SECOND}的到期日`)).toHaveAttribute("min", "2026-01-15");
      },
    },
    {
      name: "changing an end date patches only that row",
      periods,
      act: () => fireEvent.change(screen.getByLabelText(`${SECOND}的到期日`), { target: { value: "2026-04-30" } }),
      expectChange: (next) => {
        expect(next.map((p) => p.endDate)).toEqual(["2026-06-30", "2026-04-30"]);
        expect(next[0]).toBe(newer);
      },
    },
    {
      name: "changing an amount patches only that row",
      periods,
      act: () => fireEvent.change(screen.getByLabelText(`${FIRST}的金額`), { target: { value: "125" } }),
      expectChange: (next) => expect(next.map((p) => p.amount)).toEqual(["125", "100"]),
    },
    {
      name: "removing a row keeps the others",
      periods,
      act: () => fireEvent.click(screen.getByRole("button", { name: `移除${FIRST}` })),
      expectChange: (next) => expect(next).toEqual([older]),
    },
    {
      name: "errors follow the row's position in the data, not on screen",
      periods,
      errors: { "amountPeriods.1.endDate": "到期日不可早於起始日", "amountPeriods.0.amount": "金額必須大於 0" },
      expectDom: () => {
        expect(screen.getByLabelText(`${SECOND}的到期日`)).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByLabelText(`${FIRST}的金額`)).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByLabelText(`${FIRST}的到期日`)).toHaveAttribute("aria-invalid", "false");
        expect(screen.getByText("到期日不可早於起始日")).toBeInTheDocument();
        expect(screen.getByText("金額必須大於 0")).toBeInTheDocument();
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <AmountPeriodEditor
          currency="TWD"
          startDate="2026-01-15"
          periods={tt.periods}
          onChange={onChange}
          errors={tt.errors ?? {}}
        />,
      );

      tt.act?.();

      tt.expectDom?.();
      if (tt.expectChange) {
        expect(onChange).toHaveBeenCalledTimes(1);
        tt.expectChange(onChange.mock.calls[0][0]);
      } else {
        expect(onChange).not.toHaveBeenCalled();
      }
    });
  }
});
