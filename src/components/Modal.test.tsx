import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  const tests: {
    name: string;
    act: (dialog: HTMLElement) => void;
    expectedCloses: number;
  }[] = [
    { name: "opens as a modal dialog without closing", act: () => {}, expectedCloses: 0 },
    {
      name: "close button calls onClose",
      act: () => fireEvent.click(screen.getByRole("button", { name: "關閉" })),
      expectedCloses: 1,
    },
    { name: "clicking the backdrop calls onClose", act: (dialog) => fireEvent.click(dialog), expectedCloses: 1 },
    {
      name: "clicking inside the panel does not close",
      act: () => fireEvent.click(screen.getByText("內容")),
      expectedCloses: 0,
    },
    {
      name: "Esc (cancel) is intercepted and calls onClose",
      act: (dialog) => {
        const cancel = new Event("cancel", { cancelable: true });
        fireEvent(dialog, cancel);
        expect(cancel.defaultPrevented).toBe(true);
      },
      expectedCloses: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onClose = vi.fn();
      const { unmount } = render(
        <Modal title="新增扣款" onClose={onClose}>
          <p>內容</p>
        </Modal>,
      );
      const dialog = screen.getByRole("dialog", { name: "新增扣款" });
      expect(dialog).toHaveProperty("open", true);

      tt.act(dialog);

      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      unmount();
      expect(dialog).toHaveProperty("open", false);
    });
  }
});
