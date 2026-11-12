import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CategoryDto } from "@/types/dto";
import { flushPromises } from "@/test/async";
import { makeCategory } from "@/test/fixtures";
import { runUnsavedChangesCases } from "@/test/unsavedChanges";
import { CategoryEditForm } from "./CategoryEditForm";

describe("CategoryEditForm", () => {
  const tests: {
    name: string;
    category: CategoryDto;
    onSave: () => Promise<CategoryDto>;
    act: () => void;
    expectedPayload?: unknown;
    expectedDone: number;
    expectedAlert?: string;
  }[] = [
    {
      name: "starts from the current values and saves the edited ones",
      category: makeCategory({ id: 4, name: "影音串流", icon: "🎬" }),
      onSave: () => Promise.resolve(makeCategory({ id: 4 })),
      act: () => fireEvent.click(screen.getByRole("button", { name: "儲存" })),
      expectedPayload: [4, { name: "串流平台", icon: "📺" }],
      expectedDone: 1,
    },
    {
      name: "Enter in the name input also saves",
      category: makeCategory({ id: 4 }),
      onSave: () => Promise.resolve(makeCategory({ id: 4 })),
      act: () => fireEvent.keyDown(screen.getByLabelText("類型名稱"), { key: "Enter" }),
      expectedPayload: [4, { name: "串流平台", icon: "📺" }],
      expectedDone: 1,
    },
    {
      name: "stays open and shows why when saving fails",
      category: makeCategory({ id: 4 }),
      onSave: () => Promise.reject(new Error("類型「串流平台」已存在")),
      act: () => fireEvent.click(screen.getByRole("button", { name: "儲存" })),
      expectedPayload: [4, { name: "串流平台", icon: "📺" }],
      expectedDone: 0,
      expectedAlert: "類型「串流平台」已存在",
    },
    {
      name: "cancel closes without saving",
      category: makeCategory({ id: 4 }),
      onSave: () => Promise.resolve(makeCategory()),
      act: () => fireEvent.click(screen.getByRole("button", { name: "取消" })),
      expectedDone: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onSave = vi.fn(tt.onSave);
      const onDone = vi.fn();
      render(<CategoryEditForm category={tt.category} onSave={onSave} onDone={onDone} />);
      expect(screen.getByLabelText("類型名稱")).toHaveValue(tt.category.name);
      expect(screen.getByLabelText("類型圖示（可留空）")).toHaveValue(tt.category.icon);

      fireEvent.change(screen.getByLabelText("類型圖示（可留空）"), { target: { value: "📺" } });
      fireEvent.change(screen.getByLabelText("類型名稱"), { target: { value: "串流平台" } });
      await act(async () => {
        tt.act();
        await flushPromises();
      });

      if (tt.expectedPayload) expect(onSave).toHaveBeenCalledWith(...(tt.expectedPayload as [number, unknown]));
      else expect(onSave).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(tt.expectedDone);
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }

  it("shows an empty icon input for a category without an icon", () => {
    render(<CategoryEditForm category={makeCategory({ icon: null })} onSave={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByLabelText("類型圖示（可留空）")).toHaveValue("");
  });
});

describe("CategoryEditForm unsaved changes", () => {
  const typeName = (value: string) => fireEvent.change(screen.getByLabelText("類型名稱"), { target: { value } });

  runUnsavedChangesCases(
    () => (
      <CategoryEditForm
        category={makeCategory({ id: 4, name: "影音串流", icon: "🎬" })}
        onSave={vi.fn()}
        onDone={vi.fn()}
      />
    ),
    [
      { name: "unchanged values close without asking", expectedConfirm: false },
      { name: "an edited name asks first", edit: () => typeName("串流平台"), expectedConfirm: true },
      {
        name: "an edited emoji asks first",
        edit: () => fireEvent.change(screen.getByLabelText("類型圖示（可留空）"), { target: { value: "📺" } }),
        expectedConfirm: true,
      },
      {
        name: "a name edited back to the original closes without asking",
        edit: () => {
          typeName("串流平台");
          typeName("影音串流");
        },
        expectedConfirm: false,
      },
    ],
  );
});
