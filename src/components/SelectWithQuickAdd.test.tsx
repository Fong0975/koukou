import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectWithQuickAdd } from "./SelectWithQuickAdd";

const OPTIONS = [
  { value: "1", label: "影音串流" },
  { value: "2", label: "電信" },
];

/** Stand-in add form exposing the `done` callback through two buttons. */
const renderAddForm = (done: (newValue?: string) => void) => (
  <>
    <button type="button" onClick={() => done("9")}>
      完成新增
    </button>
    <button type="button" onClick={() => done()}>
      放棄新增
    </button>
  </>
);

describe("SelectWithQuickAdd", () => {
  const tests: {
    name: string;
    error?: string;
    act: () => void;
    expectedChanges: string[][];
    expectFormOpen: boolean;
  }[] = [
    {
      name: "starts with the add form closed",
      act: () => {},
      expectedChanges: [],
      expectFormOpen: false,
    },
    {
      name: "choosing an option reports it",
      act: () => fireEvent.change(screen.getByLabelText("類型"), { target: { value: "2" } }),
      expectedChanges: [["2"]],
      expectFormOpen: false,
    },
    {
      name: "the toggle opens the add form and hides itself",
      act: () => fireEvent.click(screen.getByRole("button", { name: "新增類型" })),
      expectedChanges: [],
      expectFormOpen: true,
    },
    {
      name: "finishing the add form selects the new value and closes it",
      act: () => {
        fireEvent.click(screen.getByRole("button", { name: "新增類型" }));
        fireEvent.click(screen.getByRole("button", { name: "完成新增" }));
      },
      expectedChanges: [["9"]],
      expectFormOpen: false,
    },
    {
      name: "cancelling the add form only closes it",
      act: () => {
        fireEvent.click(screen.getByRole("button", { name: "新增類型" }));
        fireEvent.click(screen.getByRole("button", { name: "放棄新增" }));
      },
      expectedChanges: [],
      expectFormOpen: false,
    },
    {
      name: "links the error message to the select",
      error: "請選擇類型",
      act: () => {},
      expectedChanges: [],
      expectFormOpen: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onChange = vi.fn();
      render(
        <SelectWithQuickAdd
          id="category"
          label="類型"
          placeholder="選擇類型"
          value=""
          options={OPTIONS}
          onChange={onChange}
          error={tt.error}
          addLabel="新增類型"
          renderAddForm={renderAddForm}
        />,
      );

      tt.act();

      expect(onChange.mock.calls).toEqual(tt.expectedChanges);
      expect(!!screen.queryByRole("button", { name: "完成新增" })).toBe(tt.expectFormOpen);
      expect(!!screen.queryByRole("button", { name: "新增類型" })).toBe(!tt.expectFormOpen);
      const select = screen.getByLabelText("類型");
      if (tt.error) {
        expect(select).toHaveAttribute("aria-invalid", "true");
        expect(select).toHaveAccessibleDescription(tt.error);
      } else {
        expect(select).toHaveAttribute("aria-invalid", "false");
        expect(select).not.toHaveAttribute("aria-describedby");
      }
    });
  }
});
