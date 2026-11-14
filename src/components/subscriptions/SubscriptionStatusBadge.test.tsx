import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SubscriptionStatus } from "@/lib/billing/subscriptionStatus";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

describe("SubscriptionStatusBadge", () => {
  const tests: { name: string; status: SubscriptionStatus; text: string; tone: string }[] = [
    {
      name: "a pause shows its end date",
      status: { kind: "paused", until: "2026-04-30" },
      text: "暫停中・至 2026/04/30",
      tone: "text-coin-600",
    },
    {
      name: "an ended subscription shows its end date as a warning",
      status: { kind: "ended", endDate: "2026-06-30" },
      text: "已到期・2026/06/30",
      tone: "text-berry",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<SubscriptionStatusBadge status={tt.status} />);
      expect(screen.getByText(tt.text)).toHaveClass(tt.tone);
    });
  }
});
