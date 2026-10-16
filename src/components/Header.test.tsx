import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  const tests: { name: string; versionLabel?: string; expectedLabel: string }[] = [
    { name: "shows the given version", versionLabel: "v0.1.3", expectedLabel: "v0.1.3" },
    { name: "falls back to the build version (dev in tests)", versionLabel: undefined, expectedLabel: "dev" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onOpenList = vi.fn();
      render(<Header onOpenList={onOpenList} versionLabel={tt.versionLabel} />);

      expect(screen.getByLabelText(`版本 ${tt.expectedLabel}`)).toHaveTextContent(tt.expectedLabel);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("KouKou");

      fireEvent.click(screen.getByRole("button", { name: "所有扣款" }));
      expect(onOpenList).toHaveBeenCalledTimes(1);
    });
  }
});
