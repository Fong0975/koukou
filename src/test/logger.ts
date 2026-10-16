import { vi } from "vitest";
import type { Logger } from "@/lib/logger";

/** One shared logger mock returned for every source; reset it with `vi.clearAllMocks()`. */
export const loggerMock = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } satisfies Logger;

/**
 * Stand-in for `@/lib/logger` in tests:
 * `vi.mock("@/lib/logger", () => import("@/test/logger"))`, then assert on {@link loggerMock}.
 */
export function createLogger(): Logger {
  return loggerMock;
}
