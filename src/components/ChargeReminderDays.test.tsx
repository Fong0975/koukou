import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChargeReminderDays } from "./ChargeReminderDays";

const typeDay = (value: string) => fireEvent.change(screen.getByLabelText("提前"), { target: { value } });
const addTyped = (value: string) => {
  typeDay(value);
  fireEvent.click(screen.getByRole("button", { name: "新增" }));
};

describe("ChargeReminderDays", () => {
  const tests: {
    name: string;
    days: number[];
    act: () => void;
    /** The list passed to onChange, or undefined when it is not called. */
    expectedChange?: number[];
    expectedError?: string;
    expectedChips?: string[];
    expectAddHidden?: boolean;
  }[] = [
    {
      name: "adds the charge day by typing 0",
      days: [3],
      act: () => addTyped("0"),
      expectedChange: [0, 3],
      expectedChips: ["3 天前"],
    },
    {
      name: "removes the charge day with its chip button",
      days: [0, 3],
      act: () => fireEvent.click(screen.getByRole("button", { name: "移除「當天」提醒" })),
      expectedChange: [3],
      expectedChips: ["當天", "3 天前"],
    },
    {
      name: "adds a typed day with the button",
      days: [0, 7],
      act: () => addTyped("3"),
      expectedChange: [0, 3, 7],
      expectedChips: ["當天", "7 天前"],
    },
    {
      name: "adds a typed day with Enter",
      days: [],
      act: () => {
        typeDay("5");
        fireEvent.keyDown(screen.getByLabelText("提前"), { key: "Enter" });
      },
      expectedChange: [5],
      expectedChips: [],
    },
    {
      name: "removes a day with its chip button",
      days: [0, 3, 7],
      act: () => fireEvent.click(screen.getByRole("button", { name: "移除「3 天前」提醒" })),
      expectedChange: [0, 7],
      expectedChips: ["當天", "3 天前", "7 天前"],
    },
    {
      name: "shows why a typed day is rejected",
      days: [3],
      act: () => addTyped("3"),
      expectedError: "已經有 3 天前的提醒",
      expectedChips: ["3 天前"],
    },
    {
      name: "rejects a day out of range",
      days: [],
      act: () => addTyped("45"),
      expectedError: "天數需為 0–30 的整數",
      expectedChips: [],
    },
    {
      name: "still offers the charge day once 5 days ahead are chosen",
      days: [1, 2, 3, 4, 5],
      act: () => addTyped("0"),
      expectedChange: [0, 1, 2, 3, 4, 5],
      expectedChips: ["1 天前", "2 天前", "3 天前", "4 天前", "5 天前"],
    },
    {
      name: "hides the input once the charge day and 5 days ahead are chosen",
      days: [0, 1, 2, 3, 4, 5],
      act: () => {},
      expectedChips: ["當天", "1 天前", "2 天前", "3 天前", "4 天前", "5 天前"],
      expectAddHidden: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<ChargeReminderDays days={tt.days} onChange={onChange} />);

      tt.act();

      if (tt.expectedChange) expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
      else expect(onChange).not.toHaveBeenCalled();
      if (tt.expectedError) {
        expect(screen.getByText(tt.expectedError)).toBeInTheDocument();
        expect(screen.getByLabelText("提前")).toHaveAttribute("aria-invalid", "true");
      }
      const chips = screen.queryAllByRole("listitem").map((chip) => chip.textContent);
      expect(chips).toEqual(tt.expectedChips ?? []);
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      if (tt.expectAddHidden) {
        expect(screen.queryByLabelText("提前")).not.toBeInTheDocument();
        expect(screen.queryByText("填寫 0 天代表當日")).not.toBeInTheDocument();
      } else {
        expect(screen.getByLabelText("提前")).toHaveAccessibleDescription(expect.stringContaining("填寫 0 天代表當日"));
      }
    });
  }
});
