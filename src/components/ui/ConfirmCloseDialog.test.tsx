import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CONFIRM_CLOSE_TITLE } from "@/test/unsavedChanges";
import { ConfirmCloseDialog } from "./ConfirmCloseDialog";

describe("ConfirmCloseDialog", () => {
  const tests: {
    name: string;
    act: (dialog: HTMLElement) => void;
    expectedConfirms: number;
    expectedCancels: number;
  }[] = [
    {
      name: "關閉 discards the changes",
      act: () => fireEvent.click(screen.getByText("關閉")),
      expectedConfirms: 1,
      expectedCancels: 0,
    },
    {
      name: "取消 returns to editing",
      act: () => fireEvent.click(screen.getByRole("button", { name: "取消" })),
      expectedConfirms: 0,
      expectedCancels: 1,
    },
    {
      name: "the close button returns to editing",
      act: () => fireEvent.click(screen.getByLabelText("關閉")),
      expectedConfirms: 0,
      expectedCancels: 1,
    },
    {
      name: "Esc returns to editing",
      act: (dialog) => fireEvent(dialog, new Event("cancel", { cancelable: true })),
      expectedConfirms: 0,
      expectedCancels: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(<ConfirmCloseDialog onConfirm={onConfirm} onCancel={onCancel} />);
      const dialog = screen.getByRole("dialog", { name: CONFIRM_CLOSE_TITLE });
      expect(dialog).toHaveTextContent("還有尚未儲存的變更，關閉後將會遺失。");

      tt.act(dialog);

      expect(onConfirm).toHaveBeenCalledTimes(tt.expectedConfirms);
      expect(onCancel).toHaveBeenCalledTimes(tt.expectedCancels);
    });
  }
});
