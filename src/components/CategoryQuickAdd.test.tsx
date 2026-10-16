import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CategoryDto } from "@/types/dto";
import { flushPromises } from "@/test/async";
import { makeCategory } from "@/test/fixtures";
import { CategoryQuickAdd } from "./CategoryQuickAdd";

describe("CategoryQuickAdd", () => {
  const tests: {
    name: string;
    onCreate: () => Promise<CategoryDto>;
    act: () => void;
    expectedPayload?: unknown;
    expectedDone: unknown[][];
  }[] = [
    {
      name: "saves icon and name, then selects the new category",
      onCreate: () => Promise.resolve(makeCategory({ id: 9 })),
      act: () => fireEvent.click(screen.getByRole("button", { name: "加入" })),
      expectedPayload: { name: "健身房", icon: "💪" },
      expectedDone: [["9"]],
    },
    {
      name: "Enter in the icon input also saves",
      onCreate: () => Promise.resolve(makeCategory({ id: 9 })),
      act: () => fireEvent.keyDown(screen.getByLabelText("類型圖示（可留空）"), { key: "Enter" }),
      expectedPayload: { name: "健身房", icon: "💪" },
      expectedDone: [["9"]],
    },
    {
      name: "stays open when creating fails",
      onCreate: () => Promise.reject(new Error("類型名稱重複")),
      act: () => fireEvent.click(screen.getByRole("button", { name: "加入" })),
      expectedPayload: { name: "健身房", icon: "💪" },
      expectedDone: [],
    },
    {
      name: "cancel closes without a value",
      onCreate: () => Promise.resolve(makeCategory()),
      act: () => fireEvent.click(screen.getByRole("button", { name: "取消" })),
      expectedDone: [[]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onCreate = vi.fn(tt.onCreate);
      const onDone = vi.fn();
      render(<CategoryQuickAdd onCreate={onCreate} onDone={onDone} />);

      fireEvent.change(screen.getByLabelText("類型圖示（可留空）"), { target: { value: "💪" } });
      fireEvent.change(screen.getByLabelText("新的類型名稱"), { target: { value: "健身房" } });
      await act(async () => {
        tt.act();
        await flushPromises();
      });

      if (tt.expectedPayload) expect(onCreate).toHaveBeenCalledWith(tt.expectedPayload);
      else expect(onCreate).not.toHaveBeenCalled();
      expect(onDone.mock.calls).toEqual(tt.expectedDone);
    });
  }
});
