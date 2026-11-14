import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi, type Mock } from "vitest";
import type { CategoryDto } from "@/types/dto";
import { flushPromises } from "@/test/async";
import { makeCategory } from "@/test/fixtures";
import { CategoryManagerModal } from "./CategoryManagerModal";

const streaming = makeCategory({ id: 2, name: "影音串流", icon: "🎬", sortOrder: 20 });
const telecom = makeCategory({ id: 5, name: "電信費", icon: "📱", sortOrder: 40 });
const other = makeCategory({ id: 7, name: "其他", icon: "📦", sortOrder: 999 });

type Props = ComponentProps<typeof CategoryManagerModal>;

interface Handlers {
  onCreate: Mock<Props["onCreate"]>;
  onUpdate: Mock<Props["onUpdate"]>;
  onDelete: Mock<Props["onDelete"]>;
  onMove: Mock<Props["onMove"]>;
  onClose: Mock<Props["onClose"]>;
}

describe("CategoryManagerModal", () => {
  const tests: {
    name: string;
    categories?: CategoryDto[];
    onMove?: () => Promise<void>;
    onDelete?: () => Promise<void>;
    steps: () => void;
    expectedDialogs: string[];
    expectedCalls?: Partial<Record<keyof Handlers, unknown[]>>;
    expectedAlert?: string;
    expectedText?: string;
    /** Labels of the move buttons expected to be disabled; the others must be enabled. */
    expectedDisabledMoves?: string[];
  }[] = [
    {
      name: "lists every category with its badge",
      steps: () => {},
      expectedDialogs: ["管理類型"],
      expectedText: "使用中",
    },
    {
      name: "shows a message when there are no categories",
      categories: [],
      steps: () => {},
      expectedDialogs: ["管理類型"],
      expectedText: "還沒有任何類型。",
    },
    {
      name: "the close button closes",
      steps: () => fireEvent.click(screen.getByRole("button", { name: "關閉" })),
      expectedDialogs: ["管理類型"],
      expectedCalls: { onClose: [] },
    },
    {
      name: "the add button opens the add form, which creates",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "新增類型" }));
        fireEvent.change(screen.getByLabelText("新的類型名稱"), { target: { value: "健身房" } });
        fireEvent.click(screen.getByRole("button", { name: "加入" }));
      },
      expectedDialogs: ["管理類型"],
      expectedCalls: { onCreate: [{ name: "健身房", icon: "" }] },
    },
    {
      name: "cancelling the add form hides it",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "新增類型" }));
        fireEvent.click(screen.getByRole("button", { name: "取消" }));
      },
      expectedDialogs: ["管理類型"],
    },
    {
      name: "editing a row opens its form, which updates",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "編輯「電信費」" }));
        fireEvent.change(screen.getByLabelText("類型名稱"), { target: { value: "電信" } });
        fireEvent.click(screen.getByRole("button", { name: "儲存" }));
      },
      expectedDialogs: ["管理類型"],
      expectedCalls: { onUpdate: [5, { name: "電信", icon: "📱" }] },
    },
    {
      name: "moving a category down asks to move it",
      steps: () => fireEvent.click(screen.getByRole("button", { name: "下移「影音串流」" })),
      expectedDialogs: ["管理類型"],
      expectedCalls: { onMove: [2, 1] },
    },
    {
      name: "moving a category up asks to move it",
      steps: () => fireEvent.click(screen.getByRole("button", { name: "上移「電信費」" })),
      expectedDialogs: ["管理類型"],
      expectedCalls: { onMove: [5, -1] },
    },
    {
      name: "only the ends of the list cannot move further",
      steps: () => {},
      expectedDialogs: ["管理類型"],
      expectedDisabledMoves: ["上移「影音串流」", "下移「電信費」"],
    },
    {
      name: "the 其他 catch-all at the end stays there",
      categories: [streaming, telecom, other],
      steps: () => fireEvent.click(screen.getByRole("button", { name: "上移「其他」" })),
      expectedDialogs: ["管理類型"],
      expectedDisabledMoves: ["上移「影音串流」", "下移「電信費」", "上移「其他」", "下移「其他」"],
    },
    {
      name: "a 其他 catch-all that is not last can still move",
      categories: [other, streaming],
      steps: () => fireEvent.click(screen.getByRole("button", { name: "下移「其他」" })),
      expectedDialogs: ["管理類型"],
      expectedCalls: { onMove: [7, 1] },
      expectedDisabledMoves: ["上移「其他」", "下移「影音串流」"],
    },
    {
      name: "a failed move shows why",
      onMove: () => Promise.reject(new Error("類型排序與目前的類型不一致，請重新整理後再試")),
      steps: () => fireEvent.click(screen.getByRole("button", { name: "下移「影音串流」" })),
      expectedDialogs: ["管理類型"],
      expectedCalls: { onMove: [2, 1] },
      expectedAlert: "類型排序與目前的類型不一致，請重新整理後再試",
    },
    {
      name: "deleting an unused category asks first, and confirming deletes it",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "刪除「電信費」" }));
        fireEvent.click(
          within(screen.getByRole("dialog", { name: "刪除「電信費」？" })).getByRole("button", { name: "刪除" }),
        );
      },
      expectedDialogs: ["管理類型"],
      expectedCalls: { onDelete: [5] },
    },
    {
      name: "cancelling the confirmation keeps the category",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "刪除「電信費」" }));
        fireEvent.click(
          within(screen.getByRole("dialog", { name: "刪除「電信費」？" })).getByRole("button", { name: "取消" }),
        );
      },
      expectedDialogs: ["管理類型"],
    },
    {
      name: "a category in use cannot be deleted",
      steps: () => fireEvent.click(screen.getByRole("button", { name: "刪除「影音串流」" })),
      expectedDialogs: ["管理類型"],
    },
    {
      name: "a failed delete keeps the confirmation open and shows why",
      onDelete: () => Promise.reject(new Error("仍有扣款項目使用這個類型，無法刪除")),
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "刪除「電信費」" }));
        fireEvent.click(
          within(screen.getByRole("dialog", { name: "刪除「電信費」？" })).getByRole("button", { name: "刪除" }),
        );
      },
      expectedDialogs: ["管理類型", "刪除「電信費」？"],
      expectedCalls: { onDelete: [5] },
      expectedAlert: "仍有扣款項目使用這個類型，無法刪除",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const handlers: Handlers = {
        onCreate: vi.fn<Props["onCreate"]>(() => Promise.resolve(makeCategory({ id: 9 }))),
        onUpdate: vi.fn<Props["onUpdate"]>(() => Promise.resolve(telecom)),
        onDelete: vi.fn<Props["onDelete"]>(tt.onDelete ?? (() => Promise.resolve())),
        onMove: vi.fn<Props["onMove"]>(tt.onMove ?? (() => Promise.resolve())),
        onClose: vi.fn<Props["onClose"]>(),
      };
      render(
        <CategoryManagerModal
          categories={tt.categories ?? [streaming, telecom]}
          usedCategoryIds={new Set([streaming.id])}
          {...handlers}
        />,
      );

      tt.steps();
      await act(flushPromises);

      expect(screen.queryAllByRole("dialog").map(dialogName)).toEqual(tt.expectedDialogs);
      for (const name of Object.keys(handlers) as (keyof Handlers)[]) {
        const expected = tt.expectedCalls?.[name];
        const handler = handlers[name] as Mock;
        if (expected) expect(handler).toHaveBeenCalledWith(...expected);
        else expect(handler).not.toHaveBeenCalled();
      }
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      if (tt.expectedText) expect(screen.getByText(tt.expectedText)).toBeInTheDocument();
      if (tt.expectedDisabledMoves) {
        const disabled = screen
          .getAllByRole<HTMLButtonElement>("button", { name: /^(上移|下移)「/ })
          .filter((button) => button.disabled)
          .map((button) => button.getAttribute("aria-label"));
        expect(disabled.sort()).toEqual([...tt.expectedDisabledMoves].sort());
      }
    });
  }
});

/** Reads a dialog's accessible name from the heading its aria-labelledby points to. */
function dialogName(dialog: HTMLElement): string {
  const id = dialog.getAttribute("aria-labelledby");
  return (id && document.getElementById(id)?.textContent) || "";
}
