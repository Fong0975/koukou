// @vitest-environment node
import nodeFs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRotatingFileSink, type SinkFs } from "./rotatingFileSink";

const start = new Date(2026, 7, 29, 12, 54, 38).getTime();

let root: string;

beforeEach(() => {
  root = nodeFs.mkdtempSync(path.join(os.tmpdir(), "koukou-log-"));
});

afterEach(() => {
  nodeFs.rmSync(root, { recursive: true, force: true });
});

/** Reads every file in a directory as a name → content map. */
function readDir(dir: string): Record<string, string> {
  return Object.fromEntries(
    nodeFs.readdirSync(dir).map((name) => [name, nodeFs.readFileSync(path.join(dir, name), "utf8")]),
  );
}

const failingFs: SinkFs = {
  ...nodeFs,
  appendFileSync: () => {
    throw new Error("disk full");
  },
};

describe("createRotatingFileSink", () => {
  const tests: {
    name: string;
    maxBytes: number;
    maxFiles?: number;
    /** Seconds the clock advances on each rotation. */
    tick?: number;
    existing?: Record<string, string>;
    fs?: SinkFs;
    lines: string[];
    expectedFiles: Record<string, string>;
    expectedErrors?: number;
  }[] = [
    {
      name: "creates the directory and appends lines",
      maxBytes: 100,
      lines: ["a", "b"],
      expectedFiles: { "app.log": "a\nb\n" },
    },
    {
      name: "rotates when a write would exceed the size",
      maxBytes: 10,
      lines: ["12345", "67890"],
      expectedFiles: { "app.log": "67890\n", "app-20260829T125438.log": "12345\n" },
    },
    {
      name: "counts the size of an existing file",
      maxBytes: 10,
      existing: { "app.log": "previous\n" },
      lines: ["new"],
      expectedFiles: { "app.log": "new\n", "app-20260829T125438.log": "previous\n" },
    },
    {
      name: "a line larger than the limit still goes into an empty file",
      maxBytes: 2,
      lines: ["too long"],
      expectedFiles: { "app.log": "too long\n" },
    },
    {
      name: "rotations within the same second get a numbered suffix",
      maxBytes: 1,
      tick: 0,
      lines: ["a", "b", "c", "d"],
      expectedFiles: {
        "app.log": "d\n",
        "app-20260829T125438.log": "a\n",
        "app-20260829T125438-1.log": "b\n",
        "app-20260829T125438-2.log": "c\n",
      },
    },
    {
      name: "deletes the oldest archives so at most maxFiles files remain",
      maxBytes: 1,
      maxFiles: 3,
      lines: ["a", "b", "c", "d", "e"],
      expectedFiles: { "app.log": "e\n", "app-20260829T125440.log": "c\n", "app-20260829T125441.log": "d\n" },
    },
    {
      name: "a numbered suffix counts as newer than the plain archive",
      maxBytes: 1,
      maxFiles: 3,
      tick: 0,
      lines: ["a", "b", "c", "d"],
      expectedFiles: { "app.log": "d\n", "app-20260829T125438-1.log": "b\n", "app-20260829T125438-2.log": "c\n" },
    },
    {
      name: "maxFiles 1 keeps only the active file",
      maxBytes: 1,
      maxFiles: 1,
      lines: ["a", "b"],
      expectedFiles: { "app.log": "b\n" },
    },
    {
      name: "leaves files that are not its archives alone",
      maxBytes: 1,
      maxFiles: 1,
      existing: { "other.log": "x", "app-old.log": "y", "app-20200101T000000.txt": "z" },
      lines: ["a", "b"],
      expectedFiles: { "app.log": "b\n", "other.log": "x", "app-old.log": "y", "app-20200101T000000.txt": "z" },
    },
    {
      name: "a write failure is reported once and disables the sink",
      maxBytes: 100,
      fs: failingFs,
      lines: ["a", "b"],
      expectedFiles: {},
      expectedErrors: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const dir = path.join(root, "logs");
      if (tt.existing) {
        nodeFs.mkdirSync(dir);
        for (const [name, content] of Object.entries(tt.existing)) nodeFs.writeFileSync(path.join(dir, name), content);
      }
      let rotations = 0;
      const onError = vi.fn();
      const sink = createRotatingFileSink({
        filePath: path.join(dir, "app.log"),
        maxBytes: tt.maxBytes,
        maxFiles: tt.maxFiles ?? 5,
        onError,
        fs: tt.fs,
        now: () => new Date(start + (tt.tick ?? 1) * 1000 * rotations++),
      });

      for (const line of tt.lines) sink.write(line);

      expect(readDir(dir)).toEqual(tt.expectedFiles);
      expect(onError).toHaveBeenCalledTimes(tt.expectedErrors ?? 0);
    });
  }
});
