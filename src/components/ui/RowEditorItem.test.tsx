import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RowEditorItem } from "./RowEditorItem";

describe("RowEditorItem", () => {
  const tests = [
    { name: "shows the inputs and removes on click", error: undefined },
    { name: "shows the row's error", error: "結束日需晚於開始日" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onRemove = vi.fn();
      render(
        <ul>
          <RowEditorItem removeLabel="移除第 1 段" onRemove={onRemove} error={tt.error}>
            <input aria-label="開始日" />
          </RowEditorItem>
        </ul>,
      );

      fireEvent.click(screen.getByRole("button", { name: "移除第 1 段" }));

      expect(screen.getByLabelText("開始日")).toBeInTheDocument();
      expect(onRemove).toHaveBeenCalledTimes(1);
      if (tt.error) expect(screen.getByText(tt.error)).toBeInTheDocument();
      else expect(document.querySelector(".field-error")).toBeNull();
    });
  }
});
