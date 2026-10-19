import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { DataMenu } from "./DataMenu";

const backupFile = new File(["{}"], "koukou-backup-20261019.json", { type: "application/json" });

const toggle = () => fireEvent.click(screen.getByRole("button", { name: "資料備份" }));
const choose = (name: string) => fireEvent.click(screen.getByRole("menuitem", { name }));
const pickFiles = (files: File[]) => fireEvent.change(screen.getByLabelText("選擇備份檔"), { target: { files } });

describe("DataMenu", () => {
  afterEach(() => vi.restoreAllMocks());

  const tests: {
    name: string;
    steps: (() => void)[];
    onExport?: () => Promise<void>;
    onImportFile?: () => Promise<void>;
    expectedOpen: boolean;
    expectedAlert?: string;
    expectedExports: number;
    expectedImports: File[];
    expectedPickerOpens?: number;
  }[] = [
    { name: "starts closed", steps: [], expectedOpen: false, expectedExports: 0, expectedImports: [] },
    { name: "the button opens the menu", steps: [toggle], expectedOpen: true, expectedExports: 0, expectedImports: [] },
    {
      name: "a second click closes it",
      steps: [toggle, toggle],
      expectedOpen: false,
      expectedExports: 0,
      expectedImports: [],
    },
    {
      name: "exporting closes the menu once saved",
      steps: [toggle, () => choose("匯出備份")],
      expectedOpen: false,
      expectedExports: 1,
      expectedImports: [],
    },
    {
      name: "a failed export keeps the menu open and shows why",
      steps: [toggle, () => choose("匯出備份")],
      onExport: () => Promise.reject(new Error("連不上伺服器")),
      expectedOpen: true,
      expectedAlert: "連不上伺服器",
      expectedExports: 1,
      expectedImports: [],
    },
    {
      name: "reopening clears the last error",
      steps: [toggle, () => choose("匯出備份"), toggle, toggle],
      onExport: () => Promise.reject(new Error("連不上伺服器")),
      expectedOpen: true,
      expectedExports: 1,
      expectedImports: [],
    },
    {
      name: "importing opens the file picker",
      steps: [toggle, () => choose("匯入備份")],
      expectedOpen: true,
      expectedExports: 0,
      expectedImports: [],
      expectedPickerOpens: 1,
    },
    {
      name: "a chosen file is read and the menu closes",
      steps: [toggle, () => pickFiles([backupFile])],
      expectedOpen: false,
      expectedExports: 0,
      expectedImports: [backupFile],
    },
    {
      name: "a file that cannot be read keeps the menu open and shows why",
      steps: [toggle, () => pickFiles([backupFile])],
      onImportFile: () => Promise.reject(new Error("這不是 KouKou 的備份檔")),
      expectedOpen: true,
      expectedAlert: "這不是 KouKou 的備份檔",
      expectedExports: 0,
      expectedImports: [backupFile],
    },
    {
      name: "cancelling the file picker does nothing",
      steps: [toggle, () => pickFiles([])],
      expectedOpen: true,
      expectedExports: 0,
      expectedImports: [],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onExport = vi.fn(tt.onExport ?? (() => Promise.resolve()));
      const onImportFile = vi.fn(tt.onImportFile ?? (() => Promise.resolve()));
      const openPicker = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
      render(<DataMenu onExport={onExport} onImportFile={onImportFile} />);

      for (const step of tt.steps) {
        await act(async () => {
          step();
          await flushPromises();
        });
      }

      expect(screen.getByRole("button", { name: "資料備份" })).toHaveAttribute("aria-expanded", `${tt.expectedOpen}`);
      expect(screen.queryByRole("menu", { name: "資料備份" }) !== null).toBe(tt.expectedOpen);
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(onExport).toHaveBeenCalledTimes(tt.expectedExports);
      expect(onImportFile.mock.calls).toEqual(tt.expectedImports.map((file) => [file]));
      expect(openPicker).toHaveBeenCalledTimes(tt.expectedPickerOpens ?? 0);
    });
  }
});
