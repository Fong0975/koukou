import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MoveButtons } from "./MoveButtons";

describe("MoveButtons", () => {
  const tests: {
    name: string;
    canMoveUp: boolean;
    canMoveDown: boolean;
    click: "上移「Netflix」" | "下移「Netflix」";
    expectedUp: number;
    expectedDown: number;
  }[] = [
    {
      name: "move up calls onMoveUp",
      canMoveUp: true,
      canMoveDown: true,
      click: "上移「Netflix」",
      expectedUp: 1,
      expectedDown: 0,
    },
    {
      name: "move down calls onMoveDown",
      canMoveUp: true,
      canMoveDown: true,
      click: "下移「Netflix」",
      expectedUp: 0,
      expectedDown: 1,
    },
    {
      name: "the first item cannot move up",
      canMoveUp: false,
      canMoveDown: true,
      click: "上移「Netflix」",
      expectedUp: 0,
      expectedDown: 0,
    },
    {
      name: "the last item cannot move down",
      canMoveUp: true,
      canMoveDown: false,
      click: "下移「Netflix」",
      expectedUp: 0,
      expectedDown: 0,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onMoveUp = vi.fn();
      const onMoveDown = vi.fn();
      render(
        <MoveButtons
          name="Netflix"
          canMoveUp={tt.canMoveUp}
          canMoveDown={tt.canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: tt.click }));

      expect(screen.getByRole("button", { name: "上移「Netflix」" })).toHaveProperty("disabled", !tt.canMoveUp);
      expect(screen.getByRole("button", { name: "下移「Netflix」" })).toHaveProperty("disabled", !tt.canMoveDown);
      expect(onMoveUp).toHaveBeenCalledTimes(tt.expectedUp);
      expect(onMoveDown).toHaveBeenCalledTimes(tt.expectedDown);
    });
  }
});
