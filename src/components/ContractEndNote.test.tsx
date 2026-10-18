import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContractEndNote } from "./ContractEndNote";

describe("ContractEndNote", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 18, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tests = [
    {
      name: "a future end date shows the days left",
      date: "2027-03-31",
      expected: "合約到期 2027/03/31（剩 164 天）",
      warn: false,
    },
    { name: "ending tomorrow", date: "2026-10-19", expected: "合約到期 2026/10/19（剩 1 天）", warn: false },
    { name: "ending today warns", date: "2026-10-18", expected: "合約到期 2026/10/18（今天到期）", warn: true },
    {
      name: "a past end date warns",
      date: "2026-10-15",
      expected: "合約到期 2026/10/15（已到期 3 天）",
      warn: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<ContractEndNote date={tt.date} />);
      const note = container.querySelector("p")!;

      expect(note.textContent).toBe(tt.expected);
      expect(note).toHaveClass(tt.warn ? "text-berry" : "text-ink-soft");
    });
  }
});
