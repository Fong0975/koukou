import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { todayKey } from "@/lib/dateKey";
import { ContractEndNote } from "./ContractEndNote";

describe("ContractEndNote", () => {
  const tests = [
    {
      name: "a future end date is a plain note",
      date: "2099-12-31",
      expectedText: "合約到期 2099/12/31",
      ended: false,
    },
    { name: "ending today is not ended yet", date: todayKey(), expectedText: null, ended: false },
    {
      name: "a past end date warns",
      date: "2000-01-31",
      expectedText: "合約到期 2000/01/31（已到期）",
      ended: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<ContractEndNote date={tt.date} />);
      const note = container.querySelector("p")!;

      if (tt.expectedText) expect(note).toHaveTextContent(tt.expectedText);
      expect(note.textContent?.includes("已到期")).toBe(tt.ended);
      expect(note).toHaveClass(tt.ended ? "text-berry" : "text-ink-soft");
      expect(screen.getByText(tt.date.replaceAll("-", "/"))).toBeInTheDocument();
    });
  }
});
