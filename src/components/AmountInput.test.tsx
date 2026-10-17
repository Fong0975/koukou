import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Currency } from "@/generated/prisma/enums";
import { AmountInput } from "./AmountInput";

describe("AmountInput", () => {
  const tests: {
    name: string;
    currency: Currency;
    invalid?: boolean;
    expectedPrefix: string;
    expectedInvalid: string;
  }[] = [
    { name: "TWD shows its prefix", currency: "TWD", expectedPrefix: "NT$", expectedInvalid: "false" },
    {
      name: "USD shows its prefix and can be invalid",
      currency: "USD",
      invalid: true,
      expectedPrefix: "US$",
      expectedInvalid: "true",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(<AmountInput currency={tt.currency} value="10" label="金額" invalid={tt.invalid} onChange={onChange} />);

      const input = screen.getByRole("textbox", { name: "金額" });
      expect(screen.getByText(tt.expectedPrefix)).toBeInTheDocument();
      expect(input).toHaveValue("10");
      expect(input).toHaveAttribute("aria-invalid", tt.expectedInvalid);

      fireEvent.change(input, { target: { value: "12.5" } });
      expect(onChange).toHaveBeenCalledWith("12.5");
    });
  }
});
