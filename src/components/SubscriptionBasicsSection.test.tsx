import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FieldErrors } from "@/lib/fieldErrors";
import { makeCategory } from "@/test/fixtures";
import { SubscriptionBasicsSection, type BasicsFields } from "./SubscriptionBasicsSection";

const categories = [makeCategory({ id: 2 }), makeCategory({ id: 5, name: "電信", icon: null })];

describe("SubscriptionBasicsSection", () => {
  const tests: {
    name: string;
    errors?: FieldErrors;
    act?: () => void;
    expectedPatch?: Partial<BasicsFields>;
    expectDom?: () => void;
  }[] = [
    {
      name: "marks the name and category required but not the note",
      expectDom: () => {
        expect(screen.getByRole("region", { name: "基本資料" })).toBeInTheDocument();
        expect(screen.getByLabelText("名稱")).toHaveAttribute("aria-required", "true");
        expect(screen.getByLabelText("類型")).toHaveAttribute("aria-required", "true");
        expect(screen.getByLabelText("備註")).not.toHaveAttribute("aria-required");
      },
    },
    {
      name: "typing a name patches it",
      act: () => fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Spotify" } }),
      expectedPatch: { name: "Spotify" },
    },
    {
      name: "choosing a category patches it",
      act: () => fireEvent.change(screen.getByLabelText("類型"), { target: { value: "5" } }),
      expectedPatch: { categoryId: "5" },
    },
    {
      name: "typing a note patches it",
      act: () => fireEvent.change(screen.getByLabelText("備註"), { target: { value: "家庭方案" } }),
      expectedPatch: { note: "家庭方案" },
    },
    {
      name: "shows the name and category errors",
      errors: { name: "請輸入項目名稱", categoryId: "請選擇類型" },
      expectDom: () => {
        expect(screen.getByLabelText("名稱")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByText("請輸入項目名稱")).toBeInTheDocument();
        expect(screen.getByLabelText("類型")).toHaveAccessibleDescription("請選擇類型");
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <SubscriptionBasicsSection
          name=""
          categoryId=""
          note=""
          categories={categories}
          onAddCategory={vi.fn()}
          onChange={onChange}
          errors={tt.errors ?? {}}
        />,
      );

      tt.act?.();

      tt.expectDom?.();
      if (tt.expectedPatch) expect(onChange).toHaveBeenCalledWith(tt.expectedPatch);
      else expect(onChange).not.toHaveBeenCalled();
    });
  }
});
