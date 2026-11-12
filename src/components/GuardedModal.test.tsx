import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useReportUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { CONFIRM_CLOSE_TITLE, clickCloseButton, isConfirmCloseShown } from "@/test/unsavedChanges";
import { GuardedModal } from "./GuardedModal";

function Reporter({ dirty }: { dirty: boolean }) {
  useReportUnsavedChanges(dirty);
  return null;
}

const confirmDialog = () => screen.getByRole("dialog", { name: CONFIRM_CLOSE_TITLE });
const pressEsc = (dialog: HTMLElement) => fireEvent(dialog, new Event("cancel", { cancelable: true }));

describe("GuardedModal", () => {
  const tests: {
    name: string;
    dirty?: boolean;
    childDirty?: boolean;
    act: (dialog: HTMLElement) => void;
    expectedConfirm: boolean;
    expectedCloses: number;
  }[] = [
    {
      name: "without changes the close button closes right away",
      act: () => clickCloseButton("編輯"),
      expectedConfirm: false,
      expectedCloses: 1,
    },
    {
      name: "without changes a backdrop click closes right away",
      act: (dialog) => fireEvent.click(dialog),
      expectedConfirm: false,
      expectedCloses: 1,
    },
    {
      name: "with changes the close button asks first",
      dirty: true,
      act: () => clickCloseButton("編輯"),
      expectedConfirm: true,
      expectedCloses: 0,
    },
    {
      name: "with changes a backdrop click asks first",
      dirty: true,
      act: (dialog) => fireEvent.click(dialog),
      expectedConfirm: true,
      expectedCloses: 0,
    },
    {
      name: "with changes Esc asks first",
      dirty: true,
      act: pressEsc,
      expectedConfirm: true,
      expectedCloses: 0,
    },
    {
      name: "changes reported by a form inside also ask first",
      childDirty: true,
      act: () => clickCloseButton("編輯"),
      expectedConfirm: true,
      expectedCloses: 0,
    },
    {
      name: "a clean form inside closes right away",
      childDirty: false,
      act: () => clickCloseButton("編輯"),
      expectedConfirm: false,
      expectedCloses: 1,
    },
    {
      // The parent unmounts both dialogs once onClose runs.
      name: "confirming discards the changes and closes",
      dirty: true,
      act: () => {
        clickCloseButton("編輯");
        fireEvent.click(within(confirmDialog()).getByText("關閉"));
      },
      expectedConfirm: true,
      expectedCloses: 1,
    },
    {
      name: "取消 in the question returns to editing",
      dirty: true,
      act: () => {
        clickCloseButton("編輯");
        fireEvent.click(within(confirmDialog()).getByRole("button", { name: "取消" }));
      },
      expectedConfirm: false,
      expectedCloses: 0,
    },
    {
      name: "Esc in the question returns to editing",
      dirty: true,
      act: () => {
        clickCloseButton("編輯");
        pressEsc(confirmDialog());
      },
      expectedConfirm: false,
      expectedCloses: 0,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onClose = vi.fn();
      render(
        <GuardedModal title="編輯" dirty={tt.dirty} onClose={onClose}>
          <p>內容</p>
          {tt.childDirty !== undefined && <Reporter dirty={tt.childDirty} />}
        </GuardedModal>,
      );

      tt.act(screen.getByRole("dialog", { name: "編輯" }));

      expect(isConfirmCloseShown()).toBe(tt.expectedConfirm);
      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      expect(screen.getByText("內容")).toBeInTheDocument();
    });
  }
});
