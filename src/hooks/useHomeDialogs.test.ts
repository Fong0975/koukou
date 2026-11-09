import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { useHomeDialogs } from "./useHomeDialogs";

type Dialogs = ReturnType<typeof useHomeDialogs>;

const item = makeSubscription({ id: 1, name: "Netflix" });

describe("useHomeDialogs", () => {
  const tests: {
    name: string;
    actions: ((dialogs: Dialogs) => void)[];
    expected: {
      listOpen: boolean;
      formOpen: boolean;
      editing?: SubscriptionDto;
      deleting: SubscriptionDto | null;
      reportOpen?: boolean;
      settingsOpen?: boolean;
      categoriesOpen?: boolean;
    };
  }[] = [
    {
      name: "starts with everything closed",
      actions: [],
      expected: { listOpen: false, formOpen: false, deleting: null },
    },
    {
      name: "opening the list",
      actions: [(d) => d.openList()],
      expected: { listOpen: true, formOpen: false, deleting: null },
    },
    {
      name: "adding opens an empty form above the list",
      actions: [(d) => d.openList(), (d) => d.openNew()],
      expected: { listOpen: true, formOpen: true, editing: undefined, deleting: null },
    },
    {
      name: "editing opens the form for that item",
      actions: [(d) => d.openList(), (d) => d.openEdit(item)],
      expected: { listOpen: true, formOpen: true, editing: item, deleting: null },
    },
    {
      name: "closing the form returns to the list",
      actions: [(d) => d.openList(), (d) => d.openEdit(item), (d) => d.closeForm()],
      expected: { listOpen: true, formOpen: false, editing: undefined, deleting: null },
    },
    {
      name: "deleting asks about that item above the list",
      actions: [(d) => d.openList(), (d) => d.openDelete(item)],
      expected: { listOpen: true, formOpen: false, deleting: item },
    },
    {
      name: "closing the confirmation clears it",
      actions: [(d) => d.openList(), (d) => d.openDelete(item), (d) => d.closeDelete()],
      expected: { listOpen: true, formOpen: false, deleting: null },
    },
    {
      name: "closing the list",
      actions: [(d) => d.openList(), (d) => d.closeList()],
      expected: { listOpen: false, formOpen: false, deleting: null },
    },
    {
      name: "the category manager opens above the list",
      actions: [(d) => d.openList(), (d) => d.openCategories()],
      expected: { listOpen: true, formOpen: false, deleting: null, categoriesOpen: true },
    },
    {
      name: "closing the category manager returns to the list",
      actions: [(d) => d.openList(), (d) => d.openCategories(), (d) => d.closeCategories()],
      expected: { listOpen: true, formOpen: false, deleting: null, categoriesOpen: false },
    },
    {
      name: "opening the report",
      actions: [(d) => d.openReport()],
      expected: { listOpen: false, formOpen: false, deleting: null, reportOpen: true },
    },
    {
      name: "closing the report",
      actions: [(d) => d.openReport(), (d) => d.closeReport()],
      expected: { listOpen: false, formOpen: false, deleting: null, reportOpen: false },
    },
    {
      name: "opening the notification settings",
      actions: [(d) => d.openSettings()],
      expected: { listOpen: false, formOpen: false, deleting: null, settingsOpen: true },
    },
    {
      name: "closing the notification settings",
      actions: [(d) => d.openSettings(), (d) => d.closeSettings()],
      expected: { listOpen: false, formOpen: false, deleting: null, settingsOpen: false },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { result } = renderHook(() => useHomeDialogs());

      for (const action of tt.actions) act(() => action(result.current));

      expect(result.current.listOpen).toBe(tt.expected.listOpen);
      expect(result.current.formOpen).toBe(tt.expected.formOpen);
      expect(result.current.editing).toBe(tt.expected.editing);
      expect(result.current.deleting).toBe(tt.expected.deleting);
      expect(result.current.reportOpen).toBe(tt.expected.reportOpen ?? false);
      expect(result.current.settingsOpen).toBe(tt.expected.settingsOpen ?? false);
      expect(result.current.categoriesOpen).toBe(tt.expected.categoriesOpen ?? false);
    });
  }
});
