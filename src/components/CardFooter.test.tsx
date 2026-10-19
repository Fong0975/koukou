import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardFooter } from "./CardFooter";

describe("CardFooter", () => {
  const tests = [
    {
      name: "shows the label before its amounts",
      label: "預留小計",
      amount: "NT$ 184",
      expected: ["預留小計", "NT$ 184"],
    },
    { name: "shows another label", label: "扣款小計", amount: "US$ 9.00", expected: ["扣款小計", "US$ 9.00"] },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(
        <CardFooter label={tt.label}>
          <span>{tt.amount}</span>
        </CardFooter>,
      );

      const footer = container.querySelector("footer");
      expect([...(footer?.children ?? [])].map((child) => child.textContent)).toEqual(tt.expected);
    });
  }
});
