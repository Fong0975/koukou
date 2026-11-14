import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FieldErrors } from "@/lib/form/fieldErrors";
import { newScheduleDraft, type ScheduleDraft } from "@/lib/form/subscriptionDraft";
import { makePaymentMethod } from "@/test/fixtures";
import { SubscriptionBillingSection, type BillingFields } from "./SubscriptionBillingSection";

const paymentMethods = [makePaymentMethod({ id: 3 })];
const monthly = newScheduleDraft({ cycle: "MONTHLY" });
const yearly = newScheduleDraft({ cycle: "YEARLY" });

describe("SubscriptionBillingSection", () => {
  const tests: {
    name: string;
    schedules?: ScheduleDraft[];
    errors?: FieldErrors;
    act?: () => void;
    expectPatch?: (patch: Partial<BillingFields>) => void;
    expectDom?: () => void;
  }[] = [
    {
      name: "marks the amount, charge day and payment method required",
      expectDom: () => {
        expect(screen.getByRole("region", { name: "金額與扣款" })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: "金額" })).toHaveAttribute("aria-required", "true");
        expect(screen.getByLabelText("第 1 個扣款日的日期")).toHaveAttribute("aria-required", "true");
        expect(screen.getByLabelText("扣款方式")).toHaveAttribute("aria-required", "true");
      },
    },
    {
      name: "hides the amortize toggle without a yearly charge day",
      expectDom: () => expect(screen.queryByRole("checkbox", { name: "年繳金額均攤預留" })).not.toBeInTheDocument(),
    },
    {
      name: "turning on amortize for a yearly charge day patches it",
      schedules: [yearly],
      act: () => fireEvent.click(screen.getByRole("checkbox", { name: "年繳金額均攤預留" })),
      expectPatch: (patch) => expect(patch).toEqual({ amortize: true }),
    },
    {
      name: "typing the amount patches it",
      act: () => fireEvent.change(screen.getByRole("textbox", { name: "金額" }), { target: { value: "420" } }),
      expectPatch: (patch) => expect(patch).toEqual({ amount: "420" }),
    },
    {
      name: "changing a charge day patches the schedules",
      act: () => fireEvent.change(screen.getByLabelText("第 1 個扣款日的日期"), { target: { value: "15" } }),
      expectPatch: (patch) => expect(patch.schedules?.[0].dayOfMonth).toBe("15"),
    },
    {
      name: "choosing a payment method patches it",
      act: () => fireEvent.change(screen.getByLabelText("扣款方式"), { target: { value: "3" } }),
      expectPatch: (patch) => expect(patch).toEqual({ paymentMethodId: "3" }),
    },
    {
      name: "shows the payment method error",
      errors: { paymentMethodId: "請選擇扣款方式" },
      expectDom: () => expect(screen.getByLabelText("扣款方式")).toHaveAccessibleDescription("請選擇扣款方式"),
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <SubscriptionBillingSection
          currency="TWD"
          amount="390"
          amountPeriods={[]}
          schedules={tt.schedules ?? [monthly]}
          amortize={false}
          paymentMethodId=""
          startDate="2026-01-01"
          paymentMethods={paymentMethods}
          onAddPaymentMethod={vi.fn()}
          onChange={onChange}
          errors={tt.errors ?? {}}
        />,
      );

      tt.act?.();

      tt.expectDom?.();
      if (tt.expectPatch) {
        expect(onChange).toHaveBeenCalledTimes(1);
        tt.expectPatch(onChange.mock.calls[0][0]);
      } else {
        expect(onChange).not.toHaveBeenCalled();
      }
    });
  }
});
