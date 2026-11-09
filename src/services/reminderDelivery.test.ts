// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import { loggerMock } from "@/test/logger";
import type { Dispatch } from "./notificationDispatchStore";

const { mocks } = vi.hoisted(() => ({ mocks: { pushText: vi.fn(), saveDispatch: vi.fn() } }));

vi.mock("@/lib/logger", () => import("@/test/logger"));
vi.mock("./lineClient", () => ({ pushText: mocks.pushText }));
vi.mock("./notificationDispatchStore", () => ({ saveDispatch: mocks.saveDispatch }));

import { deliverMessage, isPending, MAX_SEND_ATTEMPTS, type DeliveryResult } from "./reminderDelivery";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.saveDispatch.mockResolvedValue(undefined);
});

describe("isPending", () => {
  const tests: { name: string; previous: Dispatch | null; expected: boolean }[] = [
    { name: "a message never tried", previous: null, expected: true },
    { name: "a sent message", previous: { status: "SENT", attempts: 1 }, expected: false },
    { name: "a skipped message", previous: { status: "SKIPPED", attempts: 0 }, expected: false },
    { name: "a failed message with tries left", previous: { status: "FAILED", attempts: 1 }, expected: true },
    {
      name: "a failed message out of tries",
      previous: { status: "FAILED", attempts: MAX_SEND_ATTEMPTS },
      expected: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isPending(tt.previous)).toBe(tt.expected);
    });
  }
});

describe("deliverMessage", () => {
  const tests: {
    name: string;
    kind: "SUMMARY" | "DAILY";
    message: string | null;
    previous: Dispatch | null;
    push?: () => Promise<void>;
    expected: DeliveryResult;
    saved: [Dispatch, string?];
    pushes: number;
  }[] = [
    {
      name: "sends a message and records it",
      kind: "SUMMARY",
      message: "hello",
      previous: null,
      expected: "sent",
      saved: [{ status: "SENT", attempts: 1 }],
      pushes: 1,
    },
    {
      name: "counts a retry",
      kind: "DAILY",
      message: "hello",
      previous: { status: "FAILED", attempts: 2 },
      expected: "sent",
      saved: [{ status: "SENT", attempts: 3 }],
      pushes: 1,
    },
    {
      name: "records a message with nothing to report as skipped",
      kind: "DAILY",
      message: null,
      previous: null,
      expected: "skipped",
      saved: [{ status: "SKIPPED", attempts: 0 }],
      pushes: 0,
    },
    {
      name: "records a failed send with its reason",
      kind: "SUMMARY",
      message: "hello",
      previous: null,
      push: () => Promise.reject(new UpstreamError("LINE 拒絕傳送訊息（HTTP 400）")),
      expected: "failed",
      saved: [{ status: "FAILED", attempts: 1 }, "LINE 拒絕傳送訊息（HTTP 400）"],
      pushes: 1,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      mocks.pushText.mockImplementation(tt.push ?? (() => Promise.resolve()));

      await expect(deliverMessage("2026-11-01", tt.kind, tt.message, tt.previous)).resolves.toBe(tt.expected);

      expect(mocks.saveDispatch).toHaveBeenCalledWith("2026-11-01", tt.kind, ...tt.saved);
      expect(mocks.pushText).toHaveBeenCalledTimes(tt.pushes);
      expect(loggerMock.error).toHaveBeenCalledTimes(tt.expected === "failed" ? 1 : 0);
    });
  }
});
