import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditDeleteButtons } from "./EditDeleteButtons";

describe("EditDeleteButtons", () => {
  const tests: {
    name: string;
    inUse: boolean;
    click: "編輯「Netflix」" | "刪除「Netflix」";
    expectedEdits: number;
    expectedDeletes: number;
    expectedDeleteDisabled: boolean;
    expectedTitle: string | null;
  }[] = [
    {
      name: "edit calls onEdit",
      inUse: false,
      click: "編輯「Netflix」",
      expectedEdits: 1,
      expectedDeletes: 0,
      expectedDeleteDisabled: false,
      expectedTitle: null,
    },
    {
      name: "delete calls onDelete when unused",
      inUse: false,
      click: "刪除「Netflix」",
      expectedEdits: 0,
      expectedDeletes: 1,
      expectedDeleteDisabled: false,
      expectedTitle: null,
    },
    {
      name: "an item in use can still be edited",
      inUse: true,
      click: "編輯「Netflix」",
      expectedEdits: 1,
      expectedDeletes: 0,
      expectedDeleteDisabled: true,
      expectedTitle: "使用中無法刪除",
    },
    {
      name: "an item in use cannot be deleted",
      inUse: true,
      click: "刪除「Netflix」",
      expectedEdits: 0,
      expectedDeletes: 0,
      expectedDeleteDisabled: true,
      expectedTitle: "使用中無法刪除",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(
        <EditDeleteButtons
          name="Netflix"
          inUse={tt.inUse}
          inUseHint="使用中無法刪除"
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: tt.click }));

      const remove = screen.getByRole("button", { name: "刪除「Netflix」" });
      expect(remove).toHaveProperty("disabled", tt.expectedDeleteDisabled);
      expect(remove.getAttribute("title")).toBe(tt.expectedTitle);
      expect(onEdit).toHaveBeenCalledTimes(tt.expectedEdits);
      expect(onDelete).toHaveBeenCalledTimes(tt.expectedDeletes);
    });
  }
});
