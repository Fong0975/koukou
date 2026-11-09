import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ManagerModal } from "./ManagerModal";

describe("ManagerModal", () => {
  const tests: {
    name: string;
    isEmpty: boolean;
    error?: string | null;
    confirm?: boolean;
    steps: () => void;
    expectedList: boolean;
    expectedEmptyText: boolean;
    expectedAddForm: boolean;
    expectedAddButton: boolean;
    expectedAlert?: string;
    expectedConfirm: boolean;
  }[] = [
    {
      name: "shows the rows and an add button",
      isEmpty: false,
      steps: () => {},
      expectedList: true,
      expectedEmptyText: false,
      expectedAddForm: false,
      expectedAddButton: true,
      expectedConfirm: false,
    },
    {
      name: "shows the empty text instead of the list",
      isEmpty: true,
      steps: () => {},
      expectedList: false,
      expectedEmptyText: true,
      expectedAddForm: false,
      expectedAddButton: true,
      expectedConfirm: false,
    },
    {
      name: "the add button reveals the add form and hides itself",
      isEmpty: false,
      steps: () => fireEvent.click(screen.getByRole("button", { name: "新增項目" })),
      expectedList: true,
      expectedEmptyText: false,
      expectedAddForm: true,
      expectedAddButton: false,
      expectedConfirm: false,
    },
    {
      name: "closing the add form brings the add button back",
      isEmpty: false,
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "新增項目" }));
        fireEvent.click(screen.getByRole("button", { name: "關閉表單" }));
      },
      expectedList: true,
      expectedEmptyText: false,
      expectedAddForm: false,
      expectedAddButton: true,
      expectedConfirm: false,
    },
    {
      name: "shows a row action error as an alert",
      isEmpty: false,
      error: "排序失敗",
      steps: () => {},
      expectedList: true,
      expectedEmptyText: false,
      expectedAddForm: false,
      expectedAddButton: true,
      expectedAlert: "排序失敗",
      expectedConfirm: false,
    },
    {
      name: "renders the confirmation beside the dialog",
      isEmpty: false,
      confirm: true,
      steps: () => {},
      expectedList: true,
      expectedEmptyText: false,
      expectedAddForm: false,
      expectedAddButton: true,
      expectedConfirm: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <ManagerModal
          title="管理項目"
          addLabel="新增項目"
          renderAddForm={(close) => (
            <button type="button" onClick={close}>
              關閉表單
            </button>
          )}
          isEmpty={tt.isEmpty}
          emptyText="還沒有任何項目。"
          error={tt.error}
          confirm={tt.confirm ? <p>確認區</p> : undefined}
          onClose={vi.fn()}
        >
          <p>第一列</p>
        </ManagerModal>,
      );

      tt.steps();

      expect(screen.getByRole("dialog", { name: "管理項目" })).toBeInTheDocument();
      expect(screen.queryByText("第一列") !== null).toBe(tt.expectedList);
      expect(screen.queryByText("還沒有任何項目。") !== null).toBe(tt.expectedEmptyText);
      expect(screen.queryByRole("button", { name: "關閉表單" }) !== null).toBe(tt.expectedAddForm);
      expect(screen.queryByRole("button", { name: "新增項目" }) !== null).toBe(tt.expectedAddButton);
      expect(screen.queryByText("確認區") !== null).toBe(tt.expectedConfirm);
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});
