import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { saveOnEnter, useLookupForm } from "./useLookupForm";

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

describe("useLookupForm", () => {
  const initial = { name: "影音串流", icon: "🎬" };
  const tests: {
    name: string;
    edits: [keyof typeof initial, string][];
    save: () => Promise<string>;
    expectedSaved: unknown;
    expectedOnSaved: unknown[][];
    expectedError: string | null;
  }[] = [
    {
      name: "saves the edited values and reports the result",
      edits: [["name", "串流平台"]],
      save: () => Promise.resolve("saved"),
      expectedSaved: { name: "串流平台", icon: "🎬" },
      expectedOnSaved: [["saved"]],
      expectedError: null,
    },
    {
      name: "keeps the form open with the error when saving fails",
      edits: [["icon", "📺"]],
      save: () => Promise.reject(new Error("名稱重複")),
      expectedSaved: { name: "影音串流", icon: "📺" },
      expectedOnSaved: [],
      expectedError: "名稱重複",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const save = vi.fn(tt.save);
      const onSaved = vi.fn();
      const { result } = renderHook(() => useLookupForm(initial, save, onSaved));

      act(() => {
        for (const [key, value] of tt.edits) result.current.setField(key)(value);
      });
      await act(() => result.current.submit());

      expect(save).toHaveBeenCalledWith(tt.expectedSaved);
      expect(onSaved.mock.calls).toEqual(tt.expectedOnSaved);
      expect(result.current.error).toBe(tt.expectedError);
    });
  }
});
