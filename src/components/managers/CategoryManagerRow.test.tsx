import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CategoryDto } from "@/types/dto";
import { makeCategory } from "@/test/fixtures";
import { CategoryManagerRow } from "./CategoryManagerRow";

type Handler = "onMoveUp" | "onMoveDown" | "onEdit" | "onDelete";

describe("CategoryManagerRow", () => {
  const category = makeCategory({ name: "影音串流", icon: "🎬" });
  const tests: {
    name: string;
    category?: CategoryDto;
    inUse: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    click?: { label: string; handler: Handler };
    expectedDisabled: Record<string, boolean>;
    expectedBadge: boolean;
  }[] = [
    {
      name: "an unused category can be deleted",
      inUse: false,
      canMoveUp: true,
      canMoveDown: true,
      click: { label: "刪除「影音串流」", handler: "onDelete" },
      expectedDisabled: { 上移: false, 下移: false, 編輯: false, 刪除: false },
      expectedBadge: false,
    },
    {
      name: "a category in use is badged and cannot be deleted but can be edited",
      inUse: true,
      canMoveUp: true,
      canMoveDown: true,
      click: { label: "編輯「影音串流」", handler: "onEdit" },
      expectedDisabled: { 上移: false, 下移: false, 編輯: false, 刪除: true },
      expectedBadge: true,
    },
    {
      name: "the first category cannot move up",
      inUse: false,
      canMoveUp: false,
      canMoveDown: true,
      click: { label: "下移「影音串流」", handler: "onMoveDown" },
      expectedDisabled: { 上移: true, 下移: false, 編輯: false, 刪除: false },
      expectedBadge: false,
    },
    {
      name: "the last category cannot move down",
      inUse: false,
      canMoveUp: true,
      canMoveDown: false,
      click: { label: "上移「影音串流」", handler: "onMoveUp" },
      expectedDisabled: { 上移: false, 下移: true, 編輯: false, 刪除: false },
      expectedBadge: false,
    },
    {
      name: "a category without an icon falls back to a tag emoji",
      category: makeCategory({ name: "影音串流", icon: null }),
      inUse: false,
      canMoveUp: false,
      canMoveDown: false,
      expectedDisabled: { 上移: true, 下移: true, 編輯: false, 刪除: false },
      expectedBadge: false,
    },
    {
      name: "the 其他 catch-all can be neither renamed nor deleted",
      category: makeCategory({ name: "其他", icon: "📦" }),
      inUse: false,
      canMoveUp: false,
      canMoveDown: false,
      expectedDisabled: { 上移: true, 下移: true, 編輯: true, 刪除: true },
      expectedBadge: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const handlers = { onMoveUp: vi.fn(), onMoveDown: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
      render(
        <CategoryManagerRow
          category={tt.category ?? category}
          inUse={tt.inUse}
          canMoveUp={tt.canMoveUp}
          canMoveDown={tt.canMoveDown}
          {...handlers}
        />,
      );

      if (tt.click) fireEvent.click(screen.getByRole("button", { name: tt.click.label }));

      const shown = tt.category ?? category;
      expect(screen.getByText(shown.name)).toBeInTheDocument();
      expect(screen.getByText(shown.icon ?? "🏷️")).toBeInTheDocument();
      expect(screen.queryByText("使用中") !== null).toBe(tt.expectedBadge);
      for (const [action, disabled] of Object.entries(tt.expectedDisabled)) {
        expect(screen.getByRole("button", { name: `${action}「${shown.name}」` })).toHaveProperty("disabled", disabled);
      }
      for (const name of Object.keys(handlers) as Handler[]) {
        expect(handlers[name]).toHaveBeenCalledTimes(tt.click?.handler === name ? 1 : 0);
      }
    });
  }
});
