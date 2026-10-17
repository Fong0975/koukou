import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { Currency } from "@/generated/prisma/enums";
import { CoinListItem } from "./CoinListItem";

describe("CoinListItem", () => {
  const tests: { name: string; currency: Currency; subtitle: ReactNode; expected: string }[] = [
    {
      name: "text subtitle",
      currency: "TWD",
      subtitle: "2026 年期（10/11 扣款）",
      expected: "網域2026 年期（10/11 扣款）NT$ 84",
    },
    {
      name: "element subtitle",
      currency: "USD",
      subtitle: (
        <>
          <span aria-hidden="true">🎵 </span>音樂
        </>
      ),
      expected: "網域🎵 音樂NT$ 84",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <ul>
          <CoinListItem currency={tt.currency} title="網域" subtitle={tt.subtitle}>
            <p>NT$ 84</p>
          </CoinListItem>
        </ul>,
      );

      expect(screen.getByRole("listitem")).toHaveTextContent(tt.expected);
    });
  }
});
