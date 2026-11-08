import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { TestMessageButton } from "./TestMessageButton";

describe("TestMessageButton", () => {
  const tests: {
    name: string;
    onSendTest: () => Promise<void>;
    disabled?: boolean;
    expectedCalls: number;
    expectedStatus?: string;
    expectedAlert?: string;
  }[] = [
    {
      name: "says the message went out",
      onSendTest: () => Promise.resolve(),
      expectedCalls: 1,
      expectedStatus: "已送出，請到 LINE 查看",
    },
    {
      name: "shows why the message failed",
      onSendTest: () => Promise.reject(new Error("LINE 拒絕傳送訊息（HTTP 400）")),
      expectedCalls: 1,
      expectedAlert: "LINE 拒絕傳送訊息（HTTP 400）",
    },
    {
      name: "sends nothing while disabled",
      onSendTest: () => Promise.resolve(),
      disabled: true,
      expectedCalls: 0,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onSendTest = vi.fn(tt.onSendTest);
      render(<TestMessageButton onSendTest={onSendTest} disabled={tt.disabled} />);
      const button = screen.getByRole("button", { name: "傳送測試訊息" });

      await act(async () => {
        fireEvent.click(button);
        await flushPromises();
      });

      expect(button.hasAttribute("disabled")).toBe(Boolean(tt.disabled));
      expect(onSendTest).toHaveBeenCalledTimes(tt.expectedCalls);
      if (tt.expectedStatus) expect(screen.getByRole("status")).toHaveTextContent(tt.expectedStatus);
      else expect(screen.queryByRole("status")).not.toBeInTheDocument();
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});
