import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { expect, it, vi } from "vitest";
import { GuardedModal } from "@/components/GuardedModal";

/** Title of the question asked before closing a dialog with unsaved changes. */
export const CONFIRM_CLOSE_TITLE = "確定要關閉嗎？";

/** Title of the dialog `runUnsavedChangesCases` renders the form in. */
const HOST_TITLE = "編輯中";

/**
 * Clicks the close button "x" of the dialog with the given title.
 *
 * @param title - The dialog's title.
 */
export function clickCloseButton(title: string): void {
  fireEvent.click(within(screen.getByRole("dialog", { name: title })).getByRole("button", { name: "關閉" }));
}

/** Tells whether the question asked before closing a dialog with unsaved changes is showing. */
export function isConfirmCloseShown(): boolean {
  return screen.queryByRole("dialog", { name: CONFIRM_CLOSE_TITLE }) !== null;
}

/** One case of `runUnsavedChangesCases`. */
export interface UnsavedChangesCase {
  name: string;
  /** Edits the form before the dialog's close button is clicked; omitted to leave it untouched. */
  edit?: () => void;
  /** Whether closing asks first instead of closing right away. */
  expectedConfirm: boolean;
}

/**
 * Runs one test per case: renders the form inside a `GuardedModal`, applies the case's edits, clicks
 * the dialog's close button and checks whether it asks first or closes right away.
 *
 * @param renderForm - Renders the form under test.
 * @param tests - The cases.
 */
export function runUnsavedChangesCases(renderForm: () => ReactElement, tests: UnsavedChangesCase[]): void {
  for (const tt of tests) {
    it(tt.name, () => {
      const onClose = vi.fn();
      render(
        <GuardedModal title={HOST_TITLE} onClose={onClose}>
          {renderForm()}
        </GuardedModal>,
      );

      tt.edit?.();
      clickCloseButton(HOST_TITLE);

      expect(isConfirmCloseShown()).toBe(tt.expectedConfirm);
      expect(onClose).toHaveBeenCalledTimes(tt.expectedConfirm ? 0 : 1);
    });
  }
}
