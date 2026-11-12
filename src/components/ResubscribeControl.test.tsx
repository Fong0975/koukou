import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runUnsavedChangesCases } from "@/test/unsavedChanges";
import { ResubscribeControl } from "./ResubscribeControl";

const pickResumeDate = (value: string) => fireEvent.change(screen.getByLabelText("恢復扣款日"), { target: { value } });

describe("ResubscribeControl", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 12, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tests: {
    name: string;
    endDate: string;
    act?: () => void;
    expectedShown: boolean;
    expectedEnabled?: boolean;
    expectedResume?: string;
  }[] = [
    { name: "hidden without an end date", endDate: "", expectedShown: false },
    { name: "hidden before the end date", endDate: "2026-12-31", expectedShown: false },
    { name: "hidden on the end date, which still charges", endDate: "2026-11-12", expectedShown: false },
    {
      name: "shown once the end date has passed, waiting for a resume date",
      endDate: "2026-06-30",
      expectedShown: true,
      expectedEnabled: false,
    },
    {
      name: "a resume date after the end date resubscribes",
      endDate: "2026-06-30",
      act: () => {
        pickResumeDate("2026-12-01");
        fireEvent.click(screen.getByRole("button", { name: "重新訂閱" }));
      },
      expectedShown: true,
      expectedEnabled: false,
      expectedResume: "2026-12-01",
    },
    {
      name: "a resume date on the end date cannot resubscribe",
      endDate: "2026-06-30",
      act: () => pickResumeDate("2026-06-30"),
      expectedShown: true,
      expectedEnabled: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const onResubscribe = vi.fn();
      render(<ResubscribeControl endDate={tt.endDate} onResubscribe={onResubscribe} />);

      tt.act?.();

      if (!tt.expectedShown) {
        expect(screen.queryByLabelText("恢復扣款日")).not.toBeInTheDocument();
        return;
      }
      expect(screen.getByLabelText("恢復扣款日")).toHaveAttribute("min", "2026-07-01");
      expect(screen.getByRole("button", { name: "重新訂閱" }).matches(":disabled")).toBe(!tt.expectedEnabled);
      if (tt.expectedResume) {
        expect(onResubscribe).toHaveBeenCalledWith(tt.expectedResume);
        expect(screen.getByLabelText("恢復扣款日")).toHaveValue("");
      } else {
        expect(onResubscribe).not.toHaveBeenCalled();
      }
    });
  }
});

describe("ResubscribeControl unsaved changes", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 12, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  runUnsavedChangesCases(
    () => <ResubscribeControl endDate="2026-06-30" onResubscribe={vi.fn()} />,
    [
      { name: "an untouched resume date closes without asking", expectedConfirm: false },
      {
        name: "a picked resume date not applied yet asks first",
        edit: () => pickResumeDate("2026-12-01"),
        expectedConfirm: true,
      },
    ],
  );
});
