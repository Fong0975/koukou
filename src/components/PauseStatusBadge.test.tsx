import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PauseStatus } from "@/lib/pauses";
import { PauseStatusBadge } from "./PauseStatusBadge";

describe("PauseStatusBadge", () => {
  const tests: { name: string; status: PauseStatus; text: string; tone: string }[] = [
    {
      name: "a pause shows its end date",
      status: { kind: "paused", until: "2026-04-30" },
      text: "暫停中・至 2026/04/30",
      tone: "text-coin-600",
    },
    {
      name: "a cancellation shows its start date as a warning",
      status: { kind: "cancelled", since: "2026-08-01" },
      text: "已取消・2026/08/01 起",
      tone: "text-berry",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<PauseStatusBadge status={tt.status} />);
      expect(screen.getByText(tt.text)).toHaveClass(tt.tone);
    });
  }
});
