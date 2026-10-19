import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useDismiss } from "./useDismiss";

function Harness({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, onDismiss);
  return (
    <>
      <div ref={ref}>
        <p>inside</p>
      </div>
      <p>outside</p>
    </>
  );
}

describe("useDismiss", () => {
  const tests: { name: string; open: boolean; event: () => void; expectedCalls: number }[] = [
    {
      name: "a press outside dismisses",
      open: true,
      event: () => fireEvent.pointerDown(screen.getByText("outside")),
      expectedCalls: 1,
    },
    {
      name: "a press inside is ignored",
      open: true,
      event: () => fireEvent.pointerDown(screen.getByText("inside")),
      expectedCalls: 0,
    },
    {
      name: "Escape dismisses",
      open: true,
      event: () => fireEvent.keyDown(document, { key: "Escape" }),
      expectedCalls: 1,
    },
    {
      name: "other keys are ignored",
      open: true,
      event: () => fireEvent.keyDown(document, { key: "a" }),
      expectedCalls: 0,
    },
    {
      name: "nothing is listened to while closed",
      open: false,
      event: () => fireEvent.pointerDown(screen.getByText("outside")),
      expectedCalls: 0,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onDismiss = vi.fn();
      render(<Harness open={tt.open} onDismiss={onDismiss} />);

      tt.event();

      expect(onDismiss).toHaveBeenCalledTimes(tt.expectedCalls);
    });
  }
});
