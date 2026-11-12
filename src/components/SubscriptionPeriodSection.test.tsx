import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { newPauseDraft, type FieldErrors, type PauseDraft } from "@/lib/subscriptionDraft";
import { SubscriptionPeriodSection, type PeriodFields } from "./SubscriptionPeriodSection";

describe("SubscriptionPeriodSection", () => {
  const spring = newPauseDraft({ startDate: "2020-03-01", endDate: "2020-03-31" });

  const tests: {
    name: string;
    contractEndDate?: string;
    pauses?: PauseDraft[];
    errors?: FieldErrors;
    act?: () => void;
    expectPatch?: (patch: Partial<PeriodFields>) => void;
    expectDom?: () => void;
  }[] = [
    {
      name: "marks the start date required but not the end date",
      expectDom: () => {
        expect(screen.getByRole("region", { name: "訂閱期間" })).toBeInTheDocument();
        expect(screen.getByLabelText("起始日")).toHaveAttribute("aria-required", "true");
        expect(screen.getByLabelText("到期日")).not.toHaveAttribute("aria-required");
        expect(screen.getByText("到期日當天仍扣款，之後不再扣款；取消訂閱也填這裡。")).toBeInTheDocument();
      },
    },
    {
      name: "hides resubscribing without a past end date",
      contractEndDate: "2099-12-31",
      expectDom: () => expect(screen.queryByRole("button", { name: "重新訂閱" })).not.toBeInTheDocument(),
    },
    {
      name: "picking a start date patches it",
      act: () => fireEvent.change(screen.getByLabelText("起始日"), { target: { value: "2020-02-01" } }),
      expectPatch: (patch) => expect(patch).toEqual({ startDate: "2020-02-01" }),
    },
    {
      name: "picking an end date patches it",
      act: () => fireEvent.change(screen.getByLabelText("到期日"), { target: { value: "2020-06-30" } }),
      expectPatch: (patch) => expect(patch).toEqual({ contractEndDate: "2020-06-30" }),
    },
    {
      name: "resubscribing keeps the pauses, adds the stopped days and clears the end date",
      contractEndDate: "2020-06-30",
      pauses: [spring],
      act: () => {
        fireEvent.change(screen.getByLabelText("恢復扣款日"), { target: { value: "2020-12-01" } });
        fireEvent.click(screen.getByRole("button", { name: "重新訂閱" }));
      },
      expectPatch: (patch) => {
        expect(patch.contractEndDate).toBe("");
        expect(patch.pauses?.[0]).toBe(spring);
        expect(patch.pauses?.[1]).toMatchObject({ startDate: "2020-07-01", endDate: "2020-11-30" });
      },
    },
    {
      name: "adding a pause patches the pauses",
      act: () => fireEvent.click(screen.getByRole("button", { name: "新增暫停期間" })),
      expectPatch: (patch) => expect(patch.pauses).toHaveLength(1),
    },
    {
      name: "shows the end date error",
      errors: { contractEndDate: "到期日不可早於起始日" },
      expectDom: () => {
        expect(screen.getByLabelText("到期日")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByText("到期日不可早於起始日")).toBeInTheDocument();
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <SubscriptionPeriodSection
          startDate="2020-01-01"
          contractEndDate={tt.contractEndDate ?? ""}
          pauses={tt.pauses ?? []}
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
