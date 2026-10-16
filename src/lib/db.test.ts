// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@prisma/adapter-mariadb", () => ({
  PrismaMariaDb: class {
    constructor(readonly url: string) {}
  },
}));
vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: class {
    constructor(readonly options: { adapter: { url: string } }) {}
  },
}));

type FakeClient = { options: { adapter: { url: string } } };
const globalForPrisma = globalThis as unknown as { prisma?: unknown };

describe("prisma", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalForPrisma.prisma;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    delete globalForPrisma.prisma;
  });

  const existing = { reused: true };

  const tests: {
    name: string;
    url: string;
    nodeEnv: string;
    existingClient?: unknown;
    expectedError?: string;
    expectedUrl?: string;
    expectCached: boolean;
  }[] = [
    {
      name: "refuses to start without DATABASE_URL",
      url: "",
      nodeEnv: "development",
      expectedError: "DATABASE_URL is not set",
      expectCached: false,
    },
    {
      name: "creates a client on the MariaDB adapter and caches it outside production",
      url: "mysql://dev",
      nodeEnv: "development",
      expectedUrl: "mysql://dev",
      expectCached: true,
    },
    {
      name: "does not cache the client in production",
      url: "mysql://prod",
      nodeEnv: "production",
      expectedUrl: "mysql://prod",
      expectCached: false,
    },
    {
      name: "reuses the client kept from a previous hot reload",
      url: "",
      nodeEnv: "development",
      existingClient: existing,
      expectCached: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      vi.stubEnv("DATABASE_URL", tt.url);
      vi.stubEnv("NODE_ENV", tt.nodeEnv);
      if (tt.existingClient) globalForPrisma.prisma = tt.existingClient;

      if (tt.expectedError) {
        await expect(import("./db")).rejects.toThrow(tt.expectedError);
        expect(globalForPrisma.prisma).toBeUndefined();
        return;
      }

      const { prisma } = await import("./db");
      if (tt.existingClient) expect(prisma).toBe(tt.existingClient);
      else expect((prisma as unknown as FakeClient).options.adapter.url).toBe(tt.expectedUrl);
      expect(globalForPrisma.prisma === prisma).toBe(tt.expectCached);
    });
  }
});
