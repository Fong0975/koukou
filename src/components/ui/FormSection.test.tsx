import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormSection } from "./FormSection";

describe("FormSection", () => {
  const tests = [
    { name: "names the region by its title", title: "基本資料", field: "名稱" },
    { name: "renders its fields inside", title: "訂閱期間", field: "起始日" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <FormSection title={tt.title}>
          <label>
            {tt.field}
            <input />
          </label>
        </FormSection>,
      );

      const region = screen.getByRole("region", { name: tt.title });
      expect(within(region).getByRole("heading", { name: tt.title })).toBeInTheDocument();
      expect(within(region).getByLabelText(tt.field)).toBeInTheDocument();
    });
  }
});
