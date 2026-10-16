// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { parseId, readJson } from "./request";

describe("readJson", () => {
  const post = (body: string) => new Request("http://localhost/api/test", { method: "POST", body });

  const tests: { name: string; body: string; expected?: unknown; error?: boolean }[] = [
    { name: "parses an object", body: '{"a":1}', expected: { a: 1 } },
    { name: "parses an array", body: "[1]", expected: [1] },
    { name: "rejects malformed JSON", body: "{a:", error: true },
    { name: "rejects empty body", body: "", error: true },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const promise = readJson(post(tt.body));
      if (tt.error) await expect(promise).rejects.toBeInstanceOf(ValidationError);
      else await expect(promise).resolves.toEqual(tt.expected);
    });
  }
});

describe("parseId", () => {
  const tests: { name: string; raw: string; expected?: number }[] = [
    { name: "parses a positive integer", raw: "42", expected: 42 },
    { name: "parses INT max", raw: "2147483647", expected: 2147483647 },
    { name: "rejects zero", raw: "0" },
    { name: "rejects leading zero", raw: "01" },
    { name: "rejects negative", raw: "-1" },
    { name: "rejects decimal", raw: "1.5" },
    { name: "rejects text", raw: "abc" },
    { name: "rejects above INT max", raw: "2147483648" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      if (tt.expected === undefined) expect(() => parseId(tt.raw)).toThrow(NotFoundError);
      else expect(parseId(tt.raw)).toBe(tt.expected);
    });
  }
});
