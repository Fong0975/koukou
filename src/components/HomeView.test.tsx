import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { makeCategory, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";

const { INPUT, subscriptions, lookups, formProps, calendarProps } = vi.hoisted(() => ({
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
}));

vi.mock("@/hooks/useSubscriptions", () => ({ useSubscriptions: () => subscriptions }));
vi.mock("@/hooks/useLookups", () => ({ useLookups: () => lookups }));

// The calendar, the form and the dialog have their own tests; stand-ins expose only the callbacks HomeView wires up.
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
vi.mock("./CalendarSection", () => ({
  CalendarSection: (props: unknown) => {
    calendarProps(props);
    return <section aria-label="月曆" />;
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

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("HomeView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(subscriptions, { items: [item], status: "ready", loadError: null });
    Object.assign(lookups, { categories: [makeCategory()], paymentMethods: [makePaymentMethod()] });
  });

  const tests: {
    name: string;
    status?: "error";
    act: () => void;
    expectedDialog: string | null;
    expectedCalls: Partial<Record<"create" | "update" | "remove" | "reload", unknown[]>>;
  }[] = [
    {
      name: "the header button opens an empty form that creates",
      act: () => {
        click("新增扣款");
        click("送出表單");
      },
      expectedDialog: "新增",
      expectedCalls: { create: [INPUT] },
    },
    {
      name: "a card's edit button opens its form, which updates that item",
      act: () => {
        click("編輯「Netflix」");
        click("送出表單");
      },
      expectedDialog: "編輯 1",
      expectedCalls: { update: [1, INPUT] },
    },
    {
      name: "closing the form removes it",
      act: () => {
        click("新增扣款");
        click("關閉表單");
      },
      expectedDialog: null,
      expectedCalls: {},
    },
    {
      name: "a card's delete button asks first, and confirming removes the item",
      act: () => {
        click("刪除「Netflix」");
        click("確認");
      },
      expectedDialog: "確認刪除 1",
      expectedCalls: { remove: [1] },
    },
    {
      name: "closing the delete dialog removes it",
      act: () => {
        click("刪除「Netflix」");
        click("關閉確認");
      },
      expectedDialog: null,
      expectedCalls: {},
    },
    {
      name: "retry after a load error reloads",
      status: "error",
      act: () => click("重新讀取"),
      expectedDialog: null,
      expectedCalls: { reload: [] },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      if (tt.status) subscriptions.status = tt.status;
      render(<HomeView />);

      tt.act();

      if (tt.expectedDialog) expect(screen.getByRole("dialog", { name: tt.expectedDialog })).toBeInTheDocument();
      else expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      for (const name of ["create", "update", "remove", "reload"] as const) {
        const expected = tt.expectedCalls[name];
        if (expected) expect(subscriptions[name]).toHaveBeenCalledWith(...expected);
        else expect(subscriptions[name]).not.toHaveBeenCalled();
      }
      expect(screen.getByRole("region", { name: "月曆" })).toBeInTheDocument();
      expect(calendarProps).toHaveBeenLastCalledWith({
        items: subscriptions.items,
        status: subscriptions.status,
        loadError: subscriptions.loadError,
        onRetry: expect.any(Function),
      });
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
