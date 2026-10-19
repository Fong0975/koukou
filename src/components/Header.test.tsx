import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { Header } from "./Header";

describe("Header", () => {
  const tests: { name: string; versionLabel?: string; expectedLabel: string }[] = [
    { name: "shows the given version", versionLabel: "v0.1.3", expectedLabel: "v0.1.3" },
    { name: "falls back to the build version (dev in tests)", versionLabel: undefined, expectedLabel: "dev" },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onOpenList = vi.fn();
      const onOpenReport = vi.fn();
      const onExport = vi.fn(() => Promise.resolve());
      render(
        <Header
          onOpenList={onOpenList}
          onOpenReport={onOpenReport}
          onExport={onExport}
          onImportFile={() => Promise.resolve()}
          versionLabel={tt.versionLabel}
        />,
      );

      expect(screen.getByLabelText(`版本 ${tt.expectedLabel}`)).toHaveTextContent(tt.expectedLabel);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("KouKou");

      fireEvent.click(screen.getByRole("button", { name: "所有扣款" }));
      expect(onOpenList).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: "年度報表" }));
      expect(onOpenReport).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: "資料備份" }));
      await act(async () => {
        fireEvent.click(screen.getByRole("menuitem", { name: "匯出備份" }));
        await flushPromises();
      });
      expect(onExport).toHaveBeenCalledTimes(1);
    });
  }
});
