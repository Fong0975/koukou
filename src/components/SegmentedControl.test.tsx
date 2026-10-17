import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const LABELS = { date: "日期", category: "分類" };

describe("SegmentedControl", () => {
  const tests: {
    name: string;
    value: keyof typeof LABELS;
    click?: string;
    expectedChecked: string;
    expectedChange?: keyof typeof LABELS;
  }[] = [
    { name: "renders the options in key order and marks the selected one", value: "date", expectedChecked: "日期" },
    {
      name: "picking another option reports it",
      value: "date",
      click: "分類",
      expectedChecked: "日期",
      expectedChange: "category",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<SegmentedControl labels={LABELS} value={tt.value} onChange={onChange} aria-label="排序方式" />);

      const group = screen.getByRole("radiogroup", { name: "排序方式" });
      expect(group).toBeInTheDocument();
      expect(screen.getAllByRole("radio").map((radio) => radio.textContent)).toEqual(["日期", "分類"]);
      expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(tt.expectedChecked);

      if (tt.click) fireEvent.click(screen.getByRole("radio", { name: tt.click }));
      if (tt.expectedChange) expect(onChange).toHaveBeenCalledWith(tt.expectedChange);
      else expect(onChange).not.toHaveBeenCalled();
    });
  }
});
