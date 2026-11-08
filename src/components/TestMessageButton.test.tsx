import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { TestMessageButton } from "./TestMessageButton";

describe("TestMessageButton", () => {
  const tests: { name: string; onSendTest: () => Promise<void>; expectedStatus?: string; expectedAlert?: string }[] = [
    {
      name: "says the message went out",
      onSendTest: () => Promise.resolve(),
      expectedStatus: "已送出，請到 LINE 查看",
    },
    {
      name: "shows why the message failed",
      onSendTest: () => Promise.reject(new Error("LINE 拒絕傳送訊息（HTTP 400）")),
      expectedAlert: "LINE 拒絕傳送訊息（HTTP 400）",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onSendTest = vi.fn(tt.onSendTest);
      render(<TestMessageButton onSendTest={onSendTest} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "傳送測試訊息" }));
        await flushPromises();
      });

      expect(onSendTest).toHaveBeenCalledTimes(1);
      if (tt.expectedStatus) expect(screen.getByRole("status")).toHaveTextContent(tt.expectedStatus);
      else expect(screen.queryByRole("status")).not.toBeInTheDocument();
      if (tt.expectedAlert) expect(screen.getByRole("alert")).toHaveTextContent(tt.expectedAlert);
      else expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  }
});
