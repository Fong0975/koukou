import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadErrorNotice } from "./LoadErrorNotice";

describe("LoadErrorNotice", () => {
  const tests = [
    { name: "shows the reason and retries", message: "連不上伺服器", click: true, expectedRetries: 1 },
    { name: "renders without a reason", message: null, click: false, expectedRetries: 0 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onRetry = vi.fn();
      render(<LoadErrorNotice message={tt.message} onRetry={onRetry} />);

      if (tt.click) fireEvent.click(screen.getByRole("button", { name: "重新讀取" }));

      expect(screen.getByRole("alert")).toHaveTextContent(`讀不到扣款資料${tt.message ?? ""}重新讀取`);
      expect(onRetry).toHaveBeenCalledTimes(tt.expectedRetries);
    });
  }
});
