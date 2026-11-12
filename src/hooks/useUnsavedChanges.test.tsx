import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnsavedChangesContext, useReportUnsavedChanges, useUnsavedChangesTracker } from "./useUnsavedChanges";

function Reporter({ dirty }: { dirty: boolean }) {
  useReportUnsavedChanges(dirty);
  return null;
}

/** Provides a tracker to one reporter per entry of `reporters` and shows whether it is dirty. */
function Harness({ reporters }: { reporters: boolean[] }) {
  const { dirty, report } = useUnsavedChangesTracker();
  return (
    <UnsavedChangesContext.Provider value={report}>
      <output>{String(dirty)}</output>
      {reporters.map((reporterDirty, index) => (
        <Reporter key={index} dirty={reporterDirty} />
      ))}
    </UnsavedChangesContext.Provider>
  );
}

describe("useUnsavedChangesTracker", () => {
  const tests: { name: string; reporters: boolean[]; next?: boolean[]; expected: boolean }[] = [
    { name: "clean without any form", reporters: [], expected: false },
    { name: "clean while every form is clean", reporters: [false, false], expected: false },
    { name: "dirty while one form is dirty", reporters: [false, true], expected: true },
    { name: "clean again once the form is edited back", reporters: [true], next: [false], expected: false },
    { name: "clean again once the dirty form unmounts", reporters: [false, true], next: [false], expected: false },
    {
      name: "stays dirty while another form is still dirty",
      reporters: [true, true],
      next: [true, false],
      expected: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { rerender } = render(<Harness reporters={tt.reporters} />);
      if (tt.next) rerender(<Harness reporters={tt.next} />);

      expect(screen.getByRole("status")).toHaveTextContent(String(tt.expected));
    });
  }
});

describe("useReportUnsavedChanges", () => {
  const tests: { name: string; dirty: boolean }[] = [
    { name: "a dirty form outside a guarded dialog renders without reporting", dirty: true },
    { name: "a clean form outside a guarded dialog renders without reporting", dirty: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(() => render(<Reporter dirty={tt.dirty} />).unmount()).not.toThrow();
    });
  }
});
