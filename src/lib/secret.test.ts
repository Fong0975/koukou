// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readSecret } from "./secret";

describe("readSecret", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "secret-"));
  const filePath = path.join(dir, "secret");
  const missingPath = path.join(dir, "missing");

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const tests: {
    name: string;
    env: Record<string, string>;
    fileContent?: string;
    expected?: string;
    error?: string;
  }[] = [
    { name: "returns undefined when nothing is set", env: {}, expected: undefined },
    { name: "returns the plain variable without a file", env: { TEST_SECRET: "from-env" }, expected: "from-env" },
    {
      name: "prefers the file over the plain variable",
      env: { TEST_SECRET: "from-env", TEST_SECRET_FILE: filePath },
      fileContent: "from-file",
      expected: "from-file",
    },
    { name: "trims a trailing LF", env: { TEST_SECRET_FILE: filePath }, fileContent: "s3cret\n", expected: "s3cret" },
    {
      name: "trims a trailing CRLF",
      env: { TEST_SECRET_FILE: filePath },
      fileContent: "s3cret\r\n",
      expected: "s3cret",
    },
    {
      name: "keeps surrounding spaces",
      env: { TEST_SECRET_FILE: filePath },
      fileContent: " s3 cret \n",
      expected: " s3 cret ",
    },
    {
      name: "returns undefined for an empty file",
      env: { TEST_SECRET: "from-env", TEST_SECRET_FILE: filePath },
      fileContent: "",
      expected: undefined,
    },
    {
      name: "throws when the file cannot be read",
      env: { TEST_SECRET: "from-env", TEST_SECRET_FILE: missingPath },
      error: "Failed to read TEST_SECRET_FILE",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      if (tt.fileContent !== undefined) writeFileSync(filePath, tt.fileContent);

      if (tt.error) {
        expect(() => readSecret("TEST_SECRET", tt.env)).toThrow(tt.error);
      } else {
        expect(readSecret("TEST_SECRET", tt.env)).toBe(tt.expected);
      }
    });
  }
});
