import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi, type Mock } from "vitest";
import type { PaymentMethodDto } from "@/types/dto";
import { flushPromises } from "@/test/async";
import { makePaymentMethod } from "@/test/fixtures";
import { PaymentMethodManagerModal } from "./PaymentMethodManagerModal";

type Props = ComponentProps<typeof PaymentMethodManagerModal>;

interface Handlers {
  onCreate: Mock<Props["onCreate"]>;
  onUpdate: Mock<Props["onUpdate"]>;
  onDelete: Mock<Props["onDelete"]>;
  onMove: Mock<Props["onMove"]>;
  onClose: Mock<Props["onClose"]>;
}

const card = makePaymentMethod({ id: 3, name: "國泰 CUBE" });
const account = makePaymentMethod({ id: 4, type: "BANK_ACCOUNT", name: "台新 Richart" });
const secondCard = makePaymentMethod({ id: 5, name: "玉山 Pi", sortOrder: 20 });

/** Reads a dialog's accessible name from the heading its aria-labelledby points to. */
function dialogName(dialog: HTMLElement): string {
  const id = dialog.getAttribute("aria-labelledby");
  return (id && document.getElementById(id)?.textContent) || "";
}

describe("PaymentMethodManagerModal", () => {
  const tests: {
    name: string;
    paymentMethods?: PaymentMethodDto[];
    onDelete?: () => Promise<void>;
    onMove?: () => Promise<void>;
    steps: () => void;
    expectedDialogs: string[];
    expectedCalls?: Partial<Record<keyof Handlers, unknown[]>>;
    expectedAlert?: string;
    expectedText?: string;
    expectedSections?: [string, string[]][];
    expectedDisabled?: string[];
  }[] = [
    {
      name: "lists every payment method with its badge",
      steps: () => {},
      expectedDialogs: ["管理扣款方式"],
      expectedText: "使用中",
    },
    {
      name: "shows a message when there are no payment methods",
      paymentMethods: [],
      steps: () => {},
      expectedDialogs: ["管理扣款方式"],
      expectedText: "還沒有任何扣款方式。",
    },
    {
      name: "groups the payment methods under a heading per type",
      paymentMethods: [card, secondCard, account],
      steps: () => {},
      expectedDialogs: ["管理扣款方式"],
      expectedSections: [
        ["信用卡", ["國泰 CUBE", "玉山 Pi"]],
        ["帳戶扣款", ["台新 Richart"]],
      ],
    },
    {
      name: "leaves out the sections of types without payment methods",
      paymentMethods: [account],
      steps: () => {},
      expectedDialogs: ["管理扣款方式"],
      expectedSections: [["帳戶扣款", ["台新 Richart"]]],
    },
    {
      name: "the add button opens the add form, which creates",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "新增扣款方式" }));
        fireEvent.change(screen.getByLabelText("卡片或帳戶名稱"), { target: { value: "玉山 Pi" } });
        fireEvent.click(screen.getByRole("button", { name: "加入" }));
      },
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onCreate: [{ type: "CREDIT_CARD", name: "玉山 Pi" }] },
    },
    {
      name: "editing a row opens its form, which updates",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "編輯「台新 Richart」" }));
        fireEvent.change(screen.getByLabelText("卡片或帳戶名稱"), { target: { value: "台新帳戶" } });
        fireEvent.click(screen.getByRole("button", { name: "儲存" }));
      },
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onUpdate: [4, { type: "BANK_ACCOUNT", name: "台新帳戶", note: "" }] },
    },
    {
      name: "cancelling an edit restores the row",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "編輯「台新 Richart」" }));
        fireEvent.click(screen.getByRole("button", { name: "取消" }));
      },
      expectedDialogs: ["管理扣款方式"],
    },
    {
      name: "deleting an unused payment method asks first, and confirming deletes it",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "刪除「台新 Richart」" }));
        fireEvent.click(
          within(screen.getByRole("dialog", { name: "刪除「台新 Richart」？" })).getByRole("button", { name: "刪除" }),
        );
      },
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onDelete: [4] },
    },
    {
      name: "cancelling the confirmation keeps the payment method",
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "刪除「台新 Richart」" }));
        fireEvent.click(
          within(screen.getByRole("dialog", { name: "刪除「台新 Richart」？" })).getByRole("button", { name: "取消" }),
        );
      },
      expectedDialogs: ["管理扣款方式"],
    },
    {
      name: "a payment method in use cannot be deleted",
      steps: () => fireEvent.click(screen.getByRole("button", { name: "刪除「國泰 CUBE」" })),
      expectedDialogs: ["管理扣款方式"],
    },
    {
      name: "a failed delete keeps the confirmation open and shows why",
      onDelete: () => Promise.reject(new Error("仍有扣款項目使用這個扣款方式，無法刪除")),
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "刪除「台新 Richart」" }));
        fireEvent.click(
          within(screen.getByRole("dialog", { name: "刪除「台新 Richart」？" })).getByRole("button", { name: "刪除" }),
        );
      },
      expectedDialogs: ["管理扣款方式", "刪除「台新 Richart」？"],
      expectedCalls: { onDelete: [4] },
      expectedAlert: "仍有扣款項目使用這個扣款方式，無法刪除",
    },
    {
      name: "moving a payment method down asks to move it",
      paymentMethods: [card, secondCard, account],
      steps: () => fireEvent.click(screen.getByRole("button", { name: "下移「國泰 CUBE」" })),
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onMove: [3, 1] },
    },
    {
      name: "moving a payment method up asks to move it",
      paymentMethods: [card, secondCard, account],
      steps: () => fireEvent.click(screen.getByRole("button", { name: "上移「玉山 Pi」" })),
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onMove: [5, -1] },
    },
    {
      name: "the first and last of a type cannot move beyond it",
      paymentMethods: [card, secondCard, account],
      steps: () => {
        fireEvent.click(screen.getByRole("button", { name: "上移「國泰 CUBE」" }));
        fireEvent.click(screen.getByRole("button", { name: "下移「玉山 Pi」" }));
        fireEvent.click(screen.getByRole("button", { name: "上移「台新 Richart」" }));
        fireEvent.click(screen.getByRole("button", { name: "下移「台新 Richart」" }));
      },
      expectedDialogs: ["管理扣款方式"],
    },
    {
      name: "move buttons are disabled while a move is in flight",
      paymentMethods: [card, secondCard],
      onMove: () => new Promise<void>(() => {}),
      steps: () => fireEvent.click(screen.getByRole("button", { name: "下移「國泰 CUBE」" })),
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onMove: [3, 1] },
      expectedDisabled: ["上移「玉山 Pi」", "下移「國泰 CUBE」"],
    },
    {
      name: "a failed move shows why",
      paymentMethods: [card, secondCard],
      onMove: () => Promise.reject(new Error("扣款方式排序與目前的扣款方式不一致，請重新整理後再試")),
      steps: () => fireEvent.click(screen.getByRole("button", { name: "下移「國泰 CUBE」" })),
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onMove: [3, 1] },
      expectedAlert: "扣款方式排序與目前的扣款方式不一致，請重新整理後再試",
    },
    {
      name: "the close button closes",
      steps: () => fireEvent.click(screen.getByRole("button", { name: "關閉" })),
      expectedDialogs: ["管理扣款方式"],
      expectedCalls: { onClose: [] },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const handlers: Handlers = {
        onCreate: vi.fn<Props["onCreate"]>(() => Promise.resolve(makePaymentMethod({ id: 9 }))),
        onUpdate: vi.fn<Props["onUpdate"]>(() => Promise.resolve(account)),
        onDelete: vi.fn<Props["onDelete"]>(tt.onDelete ?? (() => Promise.resolve())),
        onMove: vi.fn<Props["onMove"]>(tt.onMove ?? (() => Promise.resolve())),
        onClose: vi.fn<Props["onClose"]>(),
      };
      render(
        <PaymentMethodManagerModal
          paymentMethods={tt.paymentMethods ?? [card, account]}
          usedPaymentMethodIds={new Set([card.id])}
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
      for (const label of tt.expectedDisabled ?? []) {
        expect(screen.getByRole("button", { name: label })).toBeDisabled();
      }
      if (tt.expectedSections) {
        const sections = screen.getAllByRole("region").map((section) => ({
          heading: within(section).getByRole("heading", { level: 3 }).textContent,
          items: within(section)
            .getAllByRole("listitem")
            .map((item) => item.textContent ?? ""),
        }));
        expect(sections.map((section) => section.heading)).toEqual(tt.expectedSections.map(([heading]) => heading));
        sections.forEach((section, index) => {
          const names = tt.expectedSections![index][1];
          expect(section.items).toHaveLength(names.length);
          section.items.forEach((text, itemIndex) => expect(text).toContain(names[itemIndex]));
        });
      }
    });
  }
});
