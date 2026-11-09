// @vitest-environment node
import { describe, expect, it } from "vitest";
import { toTextMessage } from "./lineMessage";

describe("toTextMessage", () => {
  const tests = [
    { name: "wraps text as a text message", text: "hello", expected: { type: "text", text: "hello" } },
    { name: "keeps null as null", text: null, expected: null },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toTextMessage(tt.text)).toEqual(tt.expected);
    });
  }
});
