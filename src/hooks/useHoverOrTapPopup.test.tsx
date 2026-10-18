import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { movePointer } from "@/test/pointer";
import { useHoverOrTapPopup } from "./useHoverOrTapPopup";

function Harness() {
  const { ref, open, hoverProps, toggle } = useHoverOrTapPopup<HTMLDivElement>();
  return (
    <>
      <div ref={ref} data-testid="wrapper" {...hoverProps}>
        <button type="button" onClick={toggle}>
          trigger
        </button>
        {open && <p>popup</p>}
      </div>
      <p>outside</p>
    </>
  );
}

const trigger = () => screen.getByRole("button", { name: "trigger" });
const wrapper = () => screen.getByTestId("wrapper");

describe("useHoverOrTapPopup", () => {
  const tests: { name: string; steps: (() => void)[]; expectedOpen: boolean }[] = [
    { name: "starts closed", steps: [], expectedOpen: false },
    { name: "a tap opens it", steps: [() => fireEvent.click(trigger())], expectedOpen: true },
    {
      name: "a second tap closes it",
      steps: [() => fireEvent.click(trigger()), () => fireEvent.click(trigger())],
      expectedOpen: false,
    },
    {
      name: "hovering with a mouse opens it",
      steps: [() => movePointer(wrapper(), "enter", "mouse")],
      expectedOpen: true,
    },
    {
      name: "moving the mouse away closes it",
      steps: [() => movePointer(wrapper(), "enter", "mouse"), () => movePointer(wrapper(), "leave", "mouse")],
      expectedOpen: false,
    },
    {
      name: "a touch entering before its tap does not count as hovering",
      steps: [() => movePointer(wrapper(), "enter", "touch"), () => fireEvent.click(trigger())],
      expectedOpen: true,
    },
    {
      name: "a click while hovering keeps it open after the mouse leaves",
      steps: [
        () => movePointer(wrapper(), "enter", "mouse"),
        () => fireEvent.click(trigger()),
        () => movePointer(wrapper(), "leave", "mouse"),
      ],
      expectedOpen: true,
    },
    {
      name: "pressing outside closes it",
      steps: [() => fireEvent.click(trigger()), () => fireEvent.pointerDown(screen.getByText("outside"))],
      expectedOpen: false,
    },
    {
      name: "pressing inside keeps it open",
      steps: [() => fireEvent.click(trigger()), () => fireEvent.pointerDown(screen.getByText("popup"))],
      expectedOpen: true,
    },
    {
      name: "Escape closes it",
      steps: [() => fireEvent.click(trigger()), () => fireEvent.keyDown(document, { key: "Escape" })],
      expectedOpen: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<Harness />);

      for (const step of tt.steps) step();

      if (tt.expectedOpen) expect(screen.getByText("popup")).toBeInTheDocument();
      else expect(screen.queryByText("popup")).not.toBeInTheDocument();
    });
  }
});
