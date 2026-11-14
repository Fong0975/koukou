import { afterEach, describe, expect, it, vi } from "vitest";
import { backupFileName, downloadJson, readJsonFile } from "./backupFile";

describe("backupFileName", () => {
  const tests = [
    { name: "uses the local day", date: new Date(2026, 9, 19, 23, 30), expected: "koukou-backup-20261019.json" },
    { name: "zero-pads month and day", date: new Date(2027, 0, 5), expected: "koukou-backup-20270105.json" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(backupFileName(tt.date)).toBe(tt.expected);
    });
  }
});

describe("downloadJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Keeps what a Blob was built from, since jsdom's Blob cannot be read back. */
  class FakeBlob {
    constructor(
      readonly parts: unknown[],
      readonly options: BlobPropertyBag,
    ) {}
  }

  const tests = [
    { name: "saves pretty-printed JSON under the file name", data: { a: 1 }, expectedText: '{\n  "a": 1\n}' },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      // jsdom implements neither object URLs nor navigation, so both are stubbed.
      const createObjectURL = vi.fn((_blob: FakeBlob) => "blob:backup");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("Blob", FakeBlob);
      vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
      const saved: { href: string; download: string }[] = [];
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
        saved.push({ href: this.getAttribute("href") ?? "", download: this.download });
      });

      downloadJson("backup.json", tt.data);

      expect(saved).toEqual([{ href: "blob:backup", download: "backup.json" }]);
      const blob = createObjectURL.mock.calls[0][0];
      expect(blob.parts).toEqual([tt.expectedText]);
      expect(blob.options).toEqual({ type: "application/json" });
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:backup");
    });
  }
});

describe("readJsonFile", () => {
  const tests: { name: string; text: string; expected?: unknown; error?: string }[] = [
    { name: "parses JSON", text: '{"format":"koukou-backup"}', expected: { format: "koukou-backup" } },
    { name: "rejects other content", text: "not json", error: "無法讀取這個檔案，請選擇 KouKou 匯出的 JSON 備份檔" },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      // jsdom's Blob has no text(), so a stand-in provides it.
      const promise = readJsonFile({ text: () => Promise.resolve(tt.text) });
      if (tt.error) await expect(promise).rejects.toThrow(tt.error);
      else await expect(promise).resolves.toEqual(tt.expected);
    });
  }
});
