import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { makeCategory, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import type { SubscriptionListProps } from "./SubscriptionList";

const { INPUT, subscriptions, lookups, formProps, calendarProps, listProps } = vi.hoisted(() => ({
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
  lookups: { categories: [], paymentMethods: [], addCategory: vi.fn(), addPaymentMethod: vi.fn() },
  formProps: vi.fn(),
  calendarProps: vi.fn(),
  listProps: vi.fn(),
}));

vi.mock("@/hooks/useSubscriptions", () => ({ useSubscriptions: () => subscriptions }));
vi.mock("@/hooks/useLookups", () => ({ useLookups: () => lookups }));

// The calendar, the list dialog, the form and the confirmation have their own tests;
// stand-ins expose only the callbacks HomeView wires up.
vi.mock("./CalendarSection", () => ({
  CalendarSection: (props: unknown) => {
    calendarProps(props);
    return <section aria-label="月曆" />;
  },
}));
vi.mock("./AllSubscriptionsModal", () => ({
  AllSubscriptionsModal: (props: SubscriptionListProps & { onClose: () => void }) => {
    listProps(props);
    return (
      <div role="dialog" aria-label="所有扣款">
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

import { HomeView } from "./HomeView";

const item = makeSubscription({ id: 1, name: "Netflix" });

const click = (...names: string[]) => {
  for (const name of names) fireEvent.click(screen.getByRole("button", { name }));
};

describe("HomeView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(subscriptions, { items: [item], status: "ready", loadError: null });
    Object.assign(lookups, { categories: [makeCategory()], paymentMethods: [makePaymentMethod()] });
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
        expect(listProps).toHaveBeenLastCalledWith(expect.objectContaining(data));
      }
      if (formProps.mock.calls.length > 0) {
        expect(formProps).toHaveBeenLastCalledWith(
          expect.objectContaining({
            categories: lookups.categories,
            paymentMethods: lookups.paymentMethods,
            onAddCategory: lookups.addCategory,
            onAddPaymentMethod: lookups.addPaymentMethod,
          }),
        );
      }
    });
  }
});
