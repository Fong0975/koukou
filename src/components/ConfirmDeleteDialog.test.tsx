import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { makeSubscription } from "@/test/fixtures";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

const item = makeSubscription({ id: 5, name: "Netflix" });

describe("ConfirmDeleteDialog", () => {
  const tests: {
    name: string;
    onConfirm: () => Promise<void>;
    click: "刪除" | "取消";
    expectedConfirmCalls: number;
    expectedCloses: number;
    expectedAlert?: string;
  }[] = [
    {
      name: "confirming deletes the item and closes",
      onConfirm: () => Promise.resolve(),
      click: "刪除",
      expectedConfirmCalls: 1,
      expectedCloses: 1,
    },
    {
      name: "a failed delete stays open and shows why",
      onConfirm: () => Promise.reject(new Error("找不到這筆扣款")),
      click: "刪除",
      expectedConfirmCalls: 1,
      expectedCloses: 0,
      expectedAlert: "找不到這筆扣款",
    },
    {
      name: "cancel closes without deleting",
      onConfirm: () => Promise.resolve(),
      click: "取消",
      expectedConfirmCalls: 0,
      expectedCloses: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onConfirm = vi.fn(tt.onConfirm);
      const onClose = vi.fn();
      render(<ConfirmDeleteDialog item={item} onConfirm={onConfirm} onClose={onClose} />);
      expect(screen.getByRole("dialog", { name: "刪除「Netflix」？" })).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: tt.click }));
        await flushPromises();
      });

      expect(onConfirm).toHaveBeenCalledTimes(tt.expectedConfirmCalls);
      if (tt.expectedConfirmCalls) expect(onConfirm).toHaveBeenCalledWith(5);
      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});
