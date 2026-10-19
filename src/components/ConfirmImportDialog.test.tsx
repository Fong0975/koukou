import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PendingImport } from "@/hooks/useBackup";
import { formatTimestamp } from "@/lib/format";
import { flushPromises } from "@/test/async";
import { ConfirmImportDialog } from "./ConfirmImportDialog";

const pending: PendingImport = {
  fileName: "koukou-backup-20261019.json",
  preview: {
    appVersion: "v1.0.12",
    exportedAt: "2026-10-19T08:00:00.000Z",
    counts: { categories: 8, paymentMethods: 3, subscriptions: 12 },
  },
  data: {},
};

/** The summary as label → value pairs. */
const summary = () =>
  Object.fromEntries(
    screen.getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]),
  );

describe("ConfirmImportDialog", () => {
  const tests: {
    name: string;
    pending: PendingImport;
    onConfirm?: () => Promise<void>;
    click?: "匯入" | "取消";
    expectedSummary: Record<string, string>;
    expectedConfirmCalls: number;
    expectedCloses: number;
    expectedAlert?: string;
  }[] = [
    {
      name: "summarizes the chosen file",
      pending,
      expectedSummary: {
        檔案: "koukou-backup-20261019.json",
        匯出時間: formatTimestamp("2026-10-19T08:00:00.000Z"),
        匯出版本: "v1.0.12",
        類型: "8 筆",
        扣款方式: "3 筆",
        扣款項目: "12 筆",
      },
      expectedConfirmCalls: 0,
      expectedCloses: 0,
    },
    {
      name: "leaves out missing metadata",
      pending: { ...pending, preview: { ...pending.preview, appVersion: null, exportedAt: null } },
      expectedSummary: { 檔案: "koukou-backup-20261019.json", 類型: "8 筆", 扣款方式: "3 筆", 扣款項目: "12 筆" },
      expectedConfirmCalls: 0,
      expectedCloses: 0,
    },
    {
      name: "confirming imports and closes",
      pending,
      click: "匯入",
      expectedSummary: expect.any(Object),
      expectedConfirmCalls: 1,
      expectedCloses: 1,
    },
    {
      name: "a failed import stays open and shows why",
      pending,
      onConfirm: () => Promise.reject(new Error("「Netflix」的類型不在備份檔中")),
      click: "匯入",
      expectedSummary: expect.any(Object),
      expectedConfirmCalls: 1,
      expectedCloses: 0,
      expectedAlert: "「Netflix」的類型不在備份檔中",
    },
    {
      name: "cancel closes without importing",
      pending,
      click: "取消",
      expectedSummary: expect.any(Object),
      expectedConfirmCalls: 0,
      expectedCloses: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onConfirm = vi.fn(tt.onConfirm ?? (() => Promise.resolve()));
      const onClose = vi.fn();
      render(<ConfirmImportDialog pending={tt.pending} onConfirm={onConfirm} onClose={onClose} />);
      expect(screen.getByRole("dialog", { name: "匯入備份？" })).toBeInTheDocument();
      expect(summary()).toEqual(tt.expectedSummary);

      if (tt.click) {
        await act(async () => {
          fireEvent.click(screen.getByRole("button", { name: tt.click }));
          await flushPromises();
        });
      }

      expect(onConfirm).toHaveBeenCalledTimes(tt.expectedConfirmCalls);
      expect(onClose).toHaveBeenCalledTimes(tt.expectedCloses);
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});
