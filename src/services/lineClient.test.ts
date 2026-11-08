// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";

vi.mock("@/lib/logger", () => import("@/test/logger"));

import { loggerMock } from "@/test/logger";
import { isLineConfigured, pushText } from "./lineClient";

const TOKEN = "secret-channel-token";
const USER_ID = "U0123456789abcdef";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN_FILE", "");
  vi.stubEnv("LINE_USER_ID_FILE", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const json =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(Response.json(body, { status }));

describe("pushText", () => {
  const tests: {
    name: string;
    token?: string;
    userId?: string;
    respond?: () => Promise<Response>;
    /** The thrown message, or undefined when the push succeeds. */
    error?: string;
  }[] = [
    { name: "pushes the text to the configured user", respond: json({}) },
    {
      name: "missing token",
      token: "",
      error: "尚未設定 LINE：請設定 LINE_CHANNEL_ACCESS_TOKEN 與 LINE_USER_ID",
    },
    {
      name: "missing user id",
      userId: "",
      error: "尚未設定 LINE：請設定 LINE_CHANNEL_ACCESS_TOKEN 與 LINE_USER_ID",
    },
    {
      name: "rejected with a reason",
      respond: json({ message: "The property, 'to', in the request body is invalid" }, 400),
      error: "LINE 拒絕傳送訊息（HTTP 400：The property, 'to', in the request body is invalid）",
    },
    {
      name: "rejected without a readable body",
      respond: () => Promise.resolve(new Response("<html>", { status: 401 })),
      error: "LINE 拒絕傳送訊息（HTTP 401）",
    },
    {
      name: "network failure",
      respond: () => Promise.reject(new TypeError("fetch failed")),
      error: "無法連線到 LINE，請稍後再試",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", tt.token ?? TOKEN);
      vi.stubEnv("LINE_USER_ID", tt.userId ?? USER_ID);
      if (tt.respond) fetchMock.mockImplementation(tt.respond);

      const result = pushText("提醒內容");

      if (tt.error) await expect(result).rejects.toThrow(new UpstreamError(tt.error));
      else await expect(result).resolves.toBeUndefined();

      if (tt.respond) {
        expect(fetchMock).toHaveBeenCalledWith("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
            "X-Line-Retry-Key": expect.stringMatching(/^[0-9a-f-]{36}$/),
          },
          body: JSON.stringify({ to: USER_ID, messages: [{ type: "text", text: "提醒內容" }] }),
          cache: "no-store",
        });
      } else {
        expect(fetchMock).not.toHaveBeenCalled();
      }
      const logged = JSON.stringify(Object.values(loggerMock).map((method) => method.mock.calls));
      expect(logged).not.toContain(TOKEN);
    });
  }
});

describe("isLineConfigured", () => {
  const tests: { name: string; env: Record<string, string>; expected: boolean; warns?: boolean }[] = [
    {
      name: "both secrets set",
      env: { LINE_CHANNEL_ACCESS_TOKEN: TOKEN, LINE_USER_ID: USER_ID },
      expected: true,
    },
    { name: "missing token", env: { LINE_CHANNEL_ACCESS_TOKEN: "", LINE_USER_ID: USER_ID }, expected: false },
    { name: "missing user id", env: { LINE_CHANNEL_ACCESS_TOKEN: TOKEN, LINE_USER_ID: "" }, expected: false },
    {
      name: "unreadable secret file",
      env: { LINE_CHANNEL_ACCESS_TOKEN_FILE: "/nonexistent/line_token", LINE_USER_ID: USER_ID },
      expected: false,
      warns: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      for (const [key, value] of Object.entries(tt.env)) vi.stubEnv(key, value);
      expect(isLineConfigured()).toBe(tt.expected);
      expect(loggerMock.warn).toHaveBeenCalledTimes(tt.warns ? 1 : 0);
    });
  }
});
