import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { REQUIRED_HINT, RequiredMark } from "./RequiredMark";

describe("RequiredMark", () => {
  const tests = [
    { name: "is hidden from assistive technology", attribute: "aria-hidden", expected: "true" },
    { name: "shows the required hint as its tooltip", attribute: "data-tooltip", expected: REQUIRED_HINT },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(
        <label htmlFor="name">
          名稱
          <RequiredMark />
          <input id="name" />
        </label>,
      );

      expect(container.querySelector(".required-mark")).toHaveAttribute(tt.attribute, tt.expected);
      expect(screen.getByLabelText("名稱")).toBeInTheDocument();
    });
  }
});
