import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { newScheduleDraft, type FieldErrors, type ScheduleDraft } from "@/lib/subscriptionDraft";
import { ScheduleEditor } from "./ScheduleEditor";

const ROW = "第 1 個扣款日";

describe("ScheduleEditor", () => {
  const tests: {
    name: string;
    schedules: ScheduleDraft[];
    errors?: FieldErrors;
    act: () => void;
    expectChange?: (next: ScheduleDraft[]) => void;
    expectDom?: () => void;
  }[] = [
    {
      name: "monthly row shows only the day input",
      schedules: [newScheduleDraft({ cycle: "MONTHLY" })],
      act: () => {},
      expectDom: () => {
        expect(screen.getByLabelText(`${ROW}的日期`)).toBeInTheDocument();
        expect(screen.queryByLabelText(`${ROW}的月份`)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(`${ROW}是星期幾`)).not.toBeInTheDocument();
      },
    },
    {
      name: "weekly row shows the weekday select",
      schedules: [newScheduleDraft({ cycle: "WEEKLY" })],
      act: () => {},
      expectDom: () => {
        expect(screen.getByLabelText(`${ROW}是星期幾`)).toBeInTheDocument();
        expect(screen.queryByLabelText(`${ROW}的日期`)).not.toBeInTheDocument();
      },
    },
    {
      name: "yearly row shows month and day",
      schedules: [newScheduleDraft({ cycle: "YEARLY" })],
      act: () => {},
      expectDom: () => {
        expect(screen.getByLabelText(`${ROW}的月份`)).toBeInTheDocument();
        expect(screen.getByLabelText(`${ROW}的日期`)).toBeInTheDocument();
      },
    },
    {
      name: "daily row shows no day inputs",
      schedules: [newScheduleDraft({ cycle: "DAILY" })],
      act: () => {},
      expectDom: () => {
        expect(screen.queryByLabelText(`${ROW}的日期`)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(`${ROW}的月份`)).not.toBeInTheDocument();
      },
    },
    {
      name: "changing the cycle patches only that row",
      schedules: [newScheduleDraft(), newScheduleDraft({ dayOfMonth: "15" })],
      act: () => fireEvent.change(screen.getByLabelText(`${ROW}的週期`), { target: { value: "WEEKLY" } }),
      expectChange: (next) => {
        expect(next.map((s) => s.cycle)).toEqual(["WEEKLY", "MONTHLY"]);
        expect(next[1].dayOfMonth).toBe("15");
      },
    },
    {
      name: "typing a day updates dayOfMonth",
      schedules: [newScheduleDraft()],
      act: () => fireEvent.change(screen.getByLabelText(`${ROW}的日期`), { target: { value: "28" } }),
      expectChange: (next) => expect(next[0].dayOfMonth).toBe("28"),
    },
    {
      name: "add button appends a monthly row",
      schedules: [newScheduleDraft({ cycle: "DAILY" })],
      act: () => fireEvent.click(screen.getByRole("button", { name: "再加一個扣款日" })),
      expectChange: (next) => {
        expect(next).toHaveLength(2);
        expect(next[1].cycle).toBe("MONTHLY");
      },
    },
    {
      name: "remove button drops that row",
      schedules: [newScheduleDraft({ dayOfMonth: "1" }), newScheduleDraft({ dayOfMonth: "15" })],
      act: () => fireEvent.click(screen.getByRole("button", { name: `移除${ROW}` })),
      expectChange: (next) => expect(next.map((s) => s.dayOfMonth)).toEqual(["15"]),
    },
    {
      name: "the only row cannot be removed",
      schedules: [newScheduleDraft()],
      act: () => {},
      expectDom: () => expect(screen.getByRole("button", { name: `移除${ROW}` })).toBeDisabled(),
    },
    {
      name: "shows row and list errors",
      schedules: [newScheduleDraft()],
      errors: { "schedules.0.dayOfMonth": "日期需介於 1–31", schedules: "扣款週期不可重複" },
      act: () => {},
      expectDom: () => {
        expect(screen.getByText("日期需介於 1–31")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("扣款週期不可重複");
        expect(screen.getByLabelText(`${ROW}的日期`)).toHaveAttribute("aria-invalid", "true");
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<ScheduleEditor schedules={tt.schedules} onChange={onChange} errors={tt.errors ?? {}} />);

      tt.act();

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
