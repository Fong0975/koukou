// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildTestMessage } from "./messageText";

describe("buildTestMessage", () => {
  const tests = [
    {
      name: "includes the send time",
      sentAt: "2026/11/08 09:00",
      expected: "✅ KouKou 測試訊息\nLINE 通知設定成功，提醒會傳送到這裡。\n傳送時間：2026/11/08 09:00",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(buildTestMessage(tt.sentAt)).toBe(tt.expected);
    });
  }
});
