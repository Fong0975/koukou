import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingImport } from "@/hooks/useBackup";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { flushPromises } from "@/test/async";
import { makeCategory, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import type { SubscriptionListProps } from "./SubscriptionList";

const {
  INPUT,
  subscriptions,
  lookups,
  backup,
  notification,
  formProps,
  calendarProps,
  listProps,
  managerProps,
  paymentManagerProps,
  reportProps,
  settingsProps,
} = vi.hoisted(() => ({
  INPUT: { name: "Netflix" } as SubscriptionInput,
  subscriptions: {
    items: [] as SubscriptionDto[],
    status: "ready" as "loading" | "ready" | "error",
    loadError: null as string | null,
    reload: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  lookups: {
    categories: [],
    paymentMethods: [],
    reload: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    removeCategory: vi.fn(),
    moveCategory: vi.fn(),
    addPaymentMethod: vi.fn(),
    updatePaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
    movePaymentMethod: vi.fn(),
  },
  backup: {
    pendingImport: null as PendingImport | null,
    exportBackup: vi.fn(),
    selectFile: vi.fn(),
    confirmImport: vi.fn(),
    closeImport: vi.fn(),
  },
  notification: { remindersActive: true, reload: vi.fn(), apply: vi.fn() },
  formProps: vi.fn(),
  calendarProps: vi.fn(),
  listProps: vi.fn(),
  managerProps: vi.fn(),
  paymentManagerProps: vi.fn(),
  reportProps: vi.fn(),
  settingsProps: vi.fn(),
}));

vi.mock("@/hooks/useSubscriptions", () => ({ useSubscriptions: () => subscriptions }));
vi.mock("@/hooks/useLookups", () => ({ useLookups: () => lookups }));
vi.mock("@/hooks/useBackup", () => ({ useBackup: () => backup }));
vi.mock("@/hooks/useNotificationSetting", () => ({ useNotificationSetting: () => notification }));

// The calendar, the list dialog, the form and the confirmations have their own tests;
// stand-ins expose only the callbacks HomeView wires up.
vi.mock("./CalendarSection", () => ({
  CalendarSection: (props: unknown) => {
    calendarProps(props);
    return <section aria-label="月曆" />;
  },
}));
vi.mock("./AllSubscriptionsModal", () => ({
  AllSubscriptionsModal: (
    props: SubscriptionListProps & {
      onManageCategories: () => void;
      onManagePaymentMethods: () => void;
      onClose: () => void;
    },
  ) => {
    listProps(props);
    return (
      <div role="dialog" aria-label="所有扣款">
        <button type="button" onClick={props.onManageCategories}>
          管理類型
        </button>
        <button type="button" onClick={props.onManagePaymentMethods}>
          管理扣款方式
        </button>
        <button type="button" onClick={props.onAdd}>
          新增
        </button>
        <button type="button" onClick={() => props.onEdit(props.items[0])}>
          編輯第一筆
        </button>
        <button type="button" onClick={() => props.onDelete(props.items[0])}>
          刪除第一筆
        </button>
        <button type="button" onClick={props.onRetry}>
          重新讀取
        </button>
        <button type="button" onClick={props.onClose}>
          關閉清單
        </button>
      </div>
    );
  },
}));
vi.mock("./CategoryManagerModal", () => ({
  CategoryManagerModal: (props: {
    onUpdate: (id: number, input: unknown) => Promise<unknown>;
    onClose: () => void;
  }) => {
    managerProps(props);
    return (
      <div role="dialog" aria-label="類型管理">
        <button type="button" onClick={() => void props.onUpdate(1, { name: "新名稱" }).catch(() => {})}>
          儲存類型
        </button>
        <button type="button" onClick={props.onClose}>
          關閉類型管理
        </button>
      </div>
    );
  },
}));
vi.mock("./PaymentMethodManagerModal", () => ({
  PaymentMethodManagerModal: (props: {
    onUpdate: (id: number, input: unknown) => Promise<unknown>;
    onClose: () => void;
  }) => {
    paymentManagerProps(props);
    return (
      <div role="dialog" aria-label="扣款方式管理">
        <button type="button" onClick={() => void props.onUpdate(3, { name: "新卡片" }).catch(() => {})}>
          儲存扣款方式
        </button>
        <button type="button" onClick={props.onClose}>
          關閉扣款方式管理
        </button>
      </div>
    );
  },
}));
vi.mock("./SubscriptionFormModal", () => ({
  SubscriptionFormModal: (props: {
    initial?: SubscriptionDto;
    onSubmit: (input: SubscriptionInput) => unknown;
    onClose: () => void;
  }) => {
    formProps(props);
    return (
      <div role="dialog" aria-label={props.initial ? `編輯 ${props.initial.id}` : "新增"}>
        <button type="button" onClick={() => props.onSubmit(INPUT)}>
          送出表單
        </button>
        <button type="button" onClick={props.onClose}>
          關閉表單
        </button>
      </div>
    );
  },
}));
vi.mock("./ConfirmDeleteDialog", () => ({
  ConfirmDeleteDialog: (props: { item: SubscriptionDto; onConfirm: (id: number) => unknown; onClose: () => void }) => (
    <div role="dialog" aria-label={`確認刪除 ${props.item.id}`}>
      <button type="button" onClick={() => props.onConfirm(props.item.id)}>
        確認
      </button>
      <button type="button" onClick={props.onClose}>
        關閉確認
      </button>
    </div>
  ),
}));

vi.mock("./report/YearReportModal", () => ({
  YearReportModal: (props: { items: SubscriptionDto[]; initialYear: number; onClose: () => void }) => {
    reportProps(props);
    return (
      <div role="dialog" aria-label="年度報表">
        <button type="button" onClick={props.onClose}>
          關閉報表
        </button>
      </div>
    );
  },
}));

vi.mock("./NotificationSettingsModal", () => ({
  NotificationSettingsModal: (props: { onClose: () => void; onSaved: unknown }) => {
    settingsProps(props);
    return (
      <div role="dialog" aria-label="通知設定">
        <button type="button" onClick={props.onClose}>
          關閉通知設定
        </button>
      </div>
    );
  },
}));

vi.mock("./ConfirmImportDialog", () => ({
  ConfirmImportDialog: (props: { pending: PendingImport; onConfirm: () => Promise<void>; onClose: () => void }) => (
    <div role="dialog" aria-label={`確認匯入 ${props.pending.fileName}`}>
      <button type="button" onClick={() => void props.onConfirm().catch(() => {})}>
        確認匯入
      </button>
      <button type="button" onClick={props.onClose}>
        關閉匯入
      </button>
    </div>
  ),
}));

import { HomeView } from "./HomeView";

const item = makeSubscription({ id: 1, name: "Netflix" });

/** Clicks each named button, or menu item when no button has that name. */
const click = (...names: string[]) => {
  for (const name of names) {
    fireEvent.click(screen.queryByRole("button", { name }) ?? screen.getByRole("menuitem", { name }));
  }
};

describe("HomeView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(subscriptions, { items: [item], status: "ready", loadError: null });
    Object.assign(lookups, { categories: [makeCategory()], paymentMethods: [makePaymentMethod()] });
    backup.pendingImport = null;
  });

  const tests: {
    name: string;
    clicks: string[];
    expectedDialogs: string[];
    expectedCalls: Partial<Record<"create" | "update" | "remove" | "reload", unknown[]>>;
  }[] = [
    { name: "starts with only the calendar", clicks: [], expectedDialogs: [], expectedCalls: {} },
    {
      name: "the header button opens the list",
      clicks: ["所有扣款"],
      expectedDialogs: ["所有扣款"],
      expectedCalls: {},
    },
    {
      name: "adding from the list opens an empty form above it, which creates",
      clicks: ["所有扣款", "新增", "送出表單"],
      expectedDialogs: ["所有扣款", "新增"],
      expectedCalls: { create: [INPUT] },
    },
    {
      name: "editing from the list opens that item's form, which updates it",
      clicks: ["所有扣款", "編輯第一筆", "送出表單"],
      expectedDialogs: ["所有扣款", "編輯 1"],
      expectedCalls: { update: [1, INPUT] },
    },
    {
      name: "closing the form returns to the list",
      clicks: ["所有扣款", "新增", "關閉表單"],
      expectedDialogs: ["所有扣款"],
      expectedCalls: {},
    },
    {
      name: "deleting from the list asks first, and confirming removes the item",
      clicks: ["所有扣款", "刪除第一筆", "確認"],
      expectedDialogs: ["所有扣款", "確認刪除 1"],
      expectedCalls: { remove: [1] },
    },
    {
      name: "closing the confirmation returns to the list",
      clicks: ["所有扣款", "刪除第一筆", "關閉確認"],
      expectedDialogs: ["所有扣款"],
      expectedCalls: {},
    },
    { name: "closing the list removes it", clicks: ["所有扣款", "關閉清單"], expectedDialogs: [], expectedCalls: {} },
    {
      name: "the list's category button opens the manager above it",
      clicks: ["所有扣款", "管理類型"],
      expectedDialogs: ["所有扣款", "類型管理"],
      expectedCalls: {},
    },
    {
      name: "closing the manager returns to the list",
      clicks: ["所有扣款", "管理類型", "關閉類型管理"],
      expectedDialogs: ["所有扣款"],
      expectedCalls: {},
    },
    {
      name: "the list's payment method button opens its manager above it",
      clicks: ["所有扣款", "管理扣款方式"],
      expectedDialogs: ["所有扣款", "扣款方式管理"],
      expectedCalls: {},
    },
    {
      name: "closing the payment method manager returns to the list",
      clicks: ["所有扣款", "管理扣款方式", "關閉扣款方式管理"],
      expectedDialogs: ["所有扣款"],
      expectedCalls: {},
    },
    {
      name: "the header button opens the annual report",
      clicks: ["年度報表"],
      expectedDialogs: ["年度報表"],
      expectedCalls: {},
    },
    { name: "closing the report removes it", clicks: ["年度報表", "關閉報表"], expectedDialogs: [], expectedCalls: {} },
    {
      name: "the header menu opens the notification settings",
      clicks: ["資料備份", "通知設定"],
      expectedDialogs: ["通知設定"],
      expectedCalls: {},
    },
    {
      name: "closing the notification settings removes them",
      clicks: ["資料備份", "通知設定", "關閉通知設定"],
      expectedDialogs: [],
      expectedCalls: {},
    },
    {
      name: "retrying from the list reloads",
      clicks: ["所有扣款", "重新讀取"],
      expectedDialogs: ["所有扣款"],
      expectedCalls: { reload: [] },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<HomeView />);

      click(...tt.clicks);

      expect(screen.queryAllByRole("dialog").map((dialog) => dialog.getAttribute("aria-label"))).toEqual(
        tt.expectedDialogs,
      );
      for (const name of ["create", "update", "remove", "reload"] as const) {
        const expected = tt.expectedCalls[name];
        if (expected) expect(subscriptions[name]).toHaveBeenCalledWith(...expected);
        else expect(subscriptions[name]).not.toHaveBeenCalled();
      }

      const data = { items: subscriptions.items, status: subscriptions.status, loadError: subscriptions.loadError };
      expect(screen.getByRole("region", { name: "月曆" })).toBeInTheDocument();
      expect(calendarProps).toHaveBeenLastCalledWith({ ...data, onRetry: expect.any(Function) });
      if (listProps.mock.calls.length > 0) {
        expect(listProps).toHaveBeenLastCalledWith(
          expect.objectContaining({ ...data, remindersActive: notification.remindersActive }),
        );
      }
      if (managerProps.mock.calls.length > 0) {
        expect(managerProps).toHaveBeenLastCalledWith(
          expect.objectContaining({
            categories: lookups.categories,
            usedCategoryIds: new Set([item.category.id]),
            onCreate: lookups.addCategory,
            onDelete: lookups.removeCategory,
            onMove: lookups.moveCategory,
          }),
        );
      }
      if (paymentManagerProps.mock.calls.length > 0) {
        expect(paymentManagerProps).toHaveBeenLastCalledWith(
          expect.objectContaining({
            paymentMethods: lookups.paymentMethods,
            usedPaymentMethodIds: new Set([item.paymentMethod.id]),
            onCreate: lookups.addPaymentMethod,
            onDelete: lookups.removePaymentMethod,
            onMove: lookups.movePaymentMethod,
          }),
        );
      }
      if (settingsProps.mock.calls.length > 0) {
        expect(settingsProps).toHaveBeenLastCalledWith(expect.objectContaining({ onSaved: notification.apply }));
      }
      if (reportProps.mock.calls.length > 0) {
        expect(reportProps).toHaveBeenLastCalledWith(
          expect.objectContaining({ items: subscriptions.items, initialYear: new Date().getFullYear() }),
        );
      }
      if (formProps.mock.calls.length > 0) {
        expect(formProps).toHaveBeenLastCalledWith(
          expect.objectContaining({
            categories: lookups.categories,
            paymentMethods: lookups.paymentMethods,
            onAddCategory: lookups.addCategory,
            onAddPaymentMethod: lookups.addPaymentMethod,
            remindersActive: notification.remindersActive,
          }),
        );
      }
    });
  }
});

describe("HomeView managers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(subscriptions, { items: [item], status: "ready", loadError: null });
  });

  const tests: {
    name: string;
    open: string;
    save: string;
    updater: "updateCategory" | "updatePaymentMethod";
    update: () => Promise<unknown>;
    expectedArgs: unknown[];
    expectedReloads: number;
  }[] = [
    {
      name: "saving a category reloads the subscriptions so they show its new name",
      open: "管理類型",
      save: "儲存類型",
      updater: "updateCategory",
      update: () => Promise.resolve({ id: 1 }),
      expectedArgs: [1, { name: "新名稱" }],
      expectedReloads: 1,
    },
    {
      name: "a failed category save does not reload the subscriptions",
      open: "管理類型",
      save: "儲存類型",
      updater: "updateCategory",
      update: () => Promise.reject(new Error("類型「其他」已存在")),
      expectedArgs: [1, { name: "新名稱" }],
      expectedReloads: 0,
    },
    {
      name: "saving a payment method reloads the subscriptions so they show its new name",
      open: "管理扣款方式",
      save: "儲存扣款方式",
      updater: "updatePaymentMethod",
      update: () => Promise.resolve({ id: 3 }),
      expectedArgs: [3, { name: "新卡片" }],
      expectedReloads: 1,
    },
    {
      name: "a failed payment method save does not reload the subscriptions",
      open: "管理扣款方式",
      save: "儲存扣款方式",
      updater: "updatePaymentMethod",
      update: () => Promise.reject(new Error("扣款方式「國泰 CUBE」已存在")),
      expectedArgs: [3, { name: "新卡片" }],
      expectedReloads: 0,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      lookups[tt.updater].mockImplementation(tt.update);
      render(<HomeView />);

      fireEvent.click(screen.getByRole("button", { name: "所有扣款" }));
      fireEvent.click(screen.getByRole("button", { name: tt.open }));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: tt.save }));
        await flushPromises();
      });

      expect(lookups[tt.updater]).toHaveBeenCalledWith(...tt.expectedArgs);
      expect(subscriptions.reload).toHaveBeenCalledTimes(tt.expectedReloads);
    });
  }
});

describe("HomeView backup", () => {
  const pending: PendingImport = {
    fileName: "koukou-backup-20261019.json",
    preview: { appVersion: null, exportedAt: null, counts: { categories: 1, paymentMethods: 1, subscriptions: 1 } },
    data: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    backup.pendingImport = null;
    backup.exportBackup.mockResolvedValue(undefined);
  });

  const tests: {
    name: string;
    pendingImport: PendingImport | null;
    confirmImport?: () => Promise<void>;
    steps: (() => void)[];
    expectedDialogs: string[];
    expectedExports: number;
    expectedConfirms: number;
    expectedReloads: number;
    expectedCloses: number;
  }[] = [
    {
      name: "the header menu exports a backup",
      pendingImport: null,
      steps: [
        () => fireEvent.click(screen.getByRole("button", { name: "資料備份" })),
        () => fireEvent.click(screen.getByRole("menuitem", { name: "匯出備份" })),
      ],
      expectedDialogs: [],
      expectedExports: 1,
      expectedConfirms: 0,
      expectedReloads: 0,
      expectedCloses: 0,
    },
    {
      name: "a chosen backup file asks for confirmation",
      pendingImport: pending,
      steps: [],
      expectedDialogs: ["確認匯入 koukou-backup-20261019.json"],
      expectedExports: 0,
      expectedConfirms: 0,
      expectedReloads: 0,
      expectedCloses: 0,
    },
    {
      name: "confirming imports and reloads the subscriptions, option lists and notification settings",
      pendingImport: pending,
      confirmImport: () => Promise.resolve(),
      steps: [() => fireEvent.click(screen.getByRole("button", { name: "確認匯入" }))],
      expectedDialogs: ["確認匯入 koukou-backup-20261019.json"],
      expectedExports: 0,
      expectedConfirms: 1,
      expectedReloads: 1,
      expectedCloses: 0,
    },
    {
      name: "a failed import reloads nothing",
      pendingImport: pending,
      confirmImport: () => Promise.reject(new Error("down")),
      steps: [() => fireEvent.click(screen.getByRole("button", { name: "確認匯入" }))],
      expectedDialogs: ["確認匯入 koukou-backup-20261019.json"],
      expectedExports: 0,
      expectedConfirms: 1,
      expectedReloads: 0,
      expectedCloses: 0,
    },
    {
      name: "closing the confirmation forgets the file",
      pendingImport: pending,
      steps: [() => fireEvent.click(screen.getByRole("button", { name: "關閉匯入" }))],
      expectedDialogs: ["確認匯入 koukou-backup-20261019.json"],
      expectedExports: 0,
      expectedConfirms: 0,
      expectedReloads: 0,
      expectedCloses: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      backup.pendingImport = tt.pendingImport;
      backup.confirmImport.mockImplementation(tt.confirmImport ?? (() => Promise.resolve()));
      render(<HomeView />);

      for (const step of tt.steps) {
        await act(async () => {
          step();
          await flushPromises();
        });
      }

      expect(screen.queryAllByRole("dialog").map((dialog) => dialog.getAttribute("aria-label"))).toEqual(
        tt.expectedDialogs,
      );
      expect(backup.exportBackup).toHaveBeenCalledTimes(tt.expectedExports);
      expect(backup.confirmImport).toHaveBeenCalledTimes(tt.expectedConfirms);
      expect(subscriptions.reload).toHaveBeenCalledTimes(tt.expectedReloads);
      expect(lookups.reload).toHaveBeenCalledTimes(tt.expectedReloads);
      expect(notification.reload).toHaveBeenCalledTimes(tt.expectedReloads);
      expect(backup.closeImport).toHaveBeenCalledTimes(tt.expectedCloses);
    });
  }
});
