import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const tests: {
    name: string;
    onConfirm: () => void | Promise<void>;
    click: "取消" | "移除";
    expectedConfirms: number;
    expectedCloses: number;
    expectedAlert?: string;
  }[] = [
    { name: "confirming runs the action", onConfirm: () => {}, click: "移除", expectedConfirms: 1, expectedCloses: 0 },
    {
      name: "cancelling closes without running the action",
      onConfirm: () => {},
      click: "取消",
      expectedConfirms: 0,
      expectedCloses: 1,
    },
    {
      name: "a failed action stays open and shows why",
      onConfirm: () => Promise.reject(new Error("移除失敗")),
      click: "移除",
      expectedConfirms: 1,
      expectedCloses: 0,
      expectedAlert: "移除失敗",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onConfirm = vi.fn(tt.onConfirm);
      const onClose = vi.fn();
      render(
        <ConfirmDialog
          title="移除？"
          confirmLabel="移除"
          pendingLabel="移除中…"
          onConfirm={onConfirm}
          onClose={onClose}
        >
          <p>說明</p>
        </ConfirmDialog>,
      );

      expect(screen.getByText("說明")).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: tt.click }));
        await flushPromises();
      });

      expect(onConfirm).toHaveBeenCalledTimes(tt.expectedConfirms);
      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});
