import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newPauseDraft, type FieldErrors, type PauseDraft } from "@/lib/subscriptionDraft";
import { PauseEditor } from "./PauseEditor";

const FIRST = "第 1 段暫停";
const SECOND = "第 2 段暫停";

describe("PauseEditor", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 18, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const spring = newPauseDraft({ startDate: "2026-03-01", endDate: "2026-04-30" });
  const summer = newPauseDraft({ startDate: "2026-08-01", endDate: "2026-08-31" });
  const pauses = [spring, summer];

  const tests: {
    name: string;
    pauses: PauseDraft[];
    errors?: FieldErrors;
    act?: () => void;
    expectChange?: (next: PauseDraft[]) => void;
    expectDom?: () => void;
  }[] = [
    {
      name: "shows only the add button without pauses",
      pauses: [],
      expectDom: () => {
        expect(screen.queryByRole("list", { name: "暫停期間（選填）" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "新增暫停期間" })).toBeInTheDocument();
      },
    },
    {
      name: "lists each pause's dates",
      pauses,
      expectDom: () => {
        const rows = within(screen.getByRole("list", { name: "暫停期間（選填）" })).getAllByRole("listitem");
        expect(rows).toHaveLength(2);
        expect(screen.getByLabelText(`${FIRST}的開始日`)).toHaveValue("2026-03-01");
        expect(screen.getByLabelText(`${FIRST}的開始日`)).toHaveAttribute("min", "2026-01-15");
        expect(screen.getByLabelText(`${FIRST}的結束日`)).toHaveValue("2026-04-30");
        expect(screen.getByLabelText(`${FIRST}的結束日`)).toHaveAttribute("min", "2026-03-01");
        expect(screen.getByLabelText(`${SECOND}的結束日`)).toHaveValue("2026-08-31");
        expect(screen.queryByText("已取消")).not.toBeInTheDocument();
      },
    },
    {
      name: "changing a start date patches only that row",
      pauses,
      act: () => fireEvent.change(screen.getByLabelText(`${FIRST}的開始日`), { target: { value: "2026-02-01" } }),
      expectChange: (next) => {
        expect(next.map((p) => p.startDate)).toEqual(["2026-02-01", "2026-08-01"]);
        expect(next[1]).toBe(summer);
      },
    },
    {
      name: "changing an end date patches only that row",
      pauses,
      act: () => fireEvent.change(screen.getByLabelText(`${SECOND}的結束日`), { target: { value: "2026-09-30" } }),
      expectChange: (next) => expect(next.map((p) => p.endDate)).toEqual(["2026-04-30", "2026-09-30"]),
    },
    {
      name: "removing a row keeps the others",
      pauses,
      act: () => fireEvent.click(screen.getByRole("button", { name: `移除${FIRST}` })),
      expectChange: (next) => expect(next).toEqual([summer]),
    },
    {
      name: "adding appends a pause starting today with its end date left to pick",
      pauses: [spring],
      act: () => fireEvent.click(screen.getByRole("button", { name: "新增暫停期間" })),
      expectChange: (next) => {
        expect(next).toHaveLength(2);
        expect(next[0]).toBe(spring);
        expect(next[1]).toMatchObject({ startDate: "2026-10-18", endDate: "" });
      },
    },
    {
      name: "shows each row's error on that row",
      pauses,
      errors: { "pauses.0.endDate": "暫停期間需在到期日之前結束", "pauses.1.startDate": "暫停期間不可重疊" },
      expectDom: () => {
        expect(screen.getByLabelText(`${FIRST}的結束日`)).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByLabelText(`${FIRST}的開始日`)).toHaveAttribute("aria-invalid", "false");
        expect(screen.getByLabelText(`${SECOND}的開始日`)).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByText("暫停期間需在到期日之前結束")).toBeInTheDocument();
        expect(screen.getByText("暫停期間不可重疊")).toBeInTheDocument();
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<PauseEditor startDate="2026-01-15" pauses={tt.pauses} onChange={onChange} errors={tt.errors ?? {}} />);

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
