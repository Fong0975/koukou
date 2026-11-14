import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconLabel } from "./IconLabel";

describe("IconLabel", () => {
  const tests = [
    { name: "an icon goes before the label, hidden from screen readers", icon: "🎵", expected: "🎵 音樂", hidden: 1 },
    { name: "without an icon only the label shows", icon: null, expected: "音樂", hidden: 0 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<IconLabel icon={tt.icon} label="音樂" />);

      expect(container.textContent).toBe(tt.expected);
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(tt.hidden);
    });
  }
});
