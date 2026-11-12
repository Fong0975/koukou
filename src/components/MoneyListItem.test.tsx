import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { MoneyListItem } from "./MoneyListItem";

describe("MoneyListItem", () => {
  const tests: { name: string; subtitle: ReactNode; expected: string }[] = [
    {
      name: "text subtitle",
      subtitle: "2026 年期 (8/12)",
      expected: "網域2026 年期 (8/12)NT$ 84",
    },
    {
      name: "element subtitle",
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
          <MoneyListItem title="網域" subtitle={tt.subtitle}>
            <p>NT$ 84</p>
          </MoneyListItem>
        </ul>,
      );

      expect(screen.getByRole("listitem")).toHaveTextContent(tt.expected);
    });
  }
});
