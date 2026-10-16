import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickAddActions, saveOnEnter } from "./QuickAddActions";

describe("QuickAddActions", () => {
  const tests: {
    name: string;
    pending: boolean;
    error: string | null;
    click?: "取消" | "加入";
    expectedSaveLabel: string;
    expectedCalls: { onSave: number; onCancel: number };
  }[] = [
    {
      name: "idle: save button calls onSave",
      pending: false,
      error: null,
      click: "加入",
      expectedSaveLabel: "加入",
      expectedCalls: { onSave: 1, onCancel: 0 },
    },
    {
      name: "cancel button calls onCancel",
      pending: false,
      error: null,
      click: "取消",
      expectedSaveLabel: "加入",
      expectedCalls: { onSave: 0, onCancel: 1 },
    },
    {
      name: "pending: save button is disabled and relabelled",
      pending: true,
      error: null,
      expectedSaveLabel: "加入中…",
      expectedCalls: { onSave: 0, onCancel: 0 },
    },
    {
      name: "shows the error as an alert",
      pending: false,
      error: "類型名稱重複",
      expectedSaveLabel: "加入",
      expectedCalls: { onSave: 0, onCancel: 0 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const handlers = { onSave: vi.fn(), onCancel: vi.fn() };
      render(<QuickAddActions pending={tt.pending} error={tt.error} {...handlers} />);

      if (tt.click) fireEvent.click(screen.getByRole("button", { name: tt.click }));

      const save = screen.getByRole("button", { name: tt.expectedSaveLabel });
      expect(save).toHaveProperty("disabled", tt.pending);
      expect(screen.getByRole("button", { name: "取消" })).toHaveAttribute("type", "button");
      if (tt.error) expect(screen.getByRole("alert")).toHaveTextContent(tt.error);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(handlers.onSave).toHaveBeenCalledTimes(tt.expectedCalls.onSave);
      expect(handlers.onCancel).toHaveBeenCalledTimes(tt.expectedCalls.onCancel);
    });
  }
});

describe("saveOnEnter", () => {
  const tests = [
    { name: "Enter saves and blocks the outer form submit", key: "Enter", expectedSaves: 1, expectedPrevented: true },
    { name: "other keys are ignored", key: "a", expectedSaves: 0, expectedPrevented: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onSave = vi.fn();
      render(<input aria-label="name" onKeyDown={saveOnEnter(onSave)} />);

      const notPrevented = fireEvent.keyDown(screen.getByLabelText("name"), { key: tt.key });

      expect(onSave).toHaveBeenCalledTimes(tt.expectedSaves);
      expect(!notPrevented).toBe(tt.expectedPrevented);
    });
  }
});
