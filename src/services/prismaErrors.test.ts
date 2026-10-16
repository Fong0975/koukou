// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { prismaError } from "@/test/prismaError";
import { rethrowPrismaError } from "./prismaErrors";

describe("rethrowPrismaError", () => {
  const all = { notFound: "nf", conflict: "dup", foreignKey: "fk" };

  const tests: {
    name: string;
    error: unknown;
    messages: typeof all | Partial<typeof all>;
    expectedType: new (...args: never[]) => Error;
    expectedMessage: string;
  }[] = [
    {
      name: "P2025 → NotFoundError",
      error: prismaError("P2025"),
      messages: all,
      expectedType: NotFoundError,
      expectedMessage: "nf",
    },
    {
      name: "P2002 → ConflictError",
      error: prismaError("P2002"),
      messages: all,
      expectedType: ConflictError,
      expectedMessage: "dup",
    },
    {
      name: "P2003 → ValidationError",
      error: prismaError("P2003"),
      messages: all,
      expectedType: ValidationError,
      expectedMessage: "fk",
    },
    {
      name: "known code without message is rethrown",
      error: prismaError("P2025"),
      messages: {},
      expectedType: Error,
      expectedMessage: "P2025",
    },
    {
      name: "other Prisma code is rethrown",
      error: prismaError("P1001"),
      messages: all,
      expectedType: Error,
      expectedMessage: "P1001",
    },
    {
      name: "non-Prisma code is rethrown",
      error: prismaError("ECONNREFUSED"),
      messages: all,
      expectedType: Error,
      expectedMessage: "ECONNREFUSED",
    },
    {
      name: "plain error is rethrown",
      error: new Error("boom"),
      messages: all,
      expectedType: Error,
      expectedMessage: "boom",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      let caught: unknown;
      try {
        rethrowPrismaError(tt.error, tt.messages);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(tt.expectedType);
      expect((caught as Error).message).toBe(tt.expectedMessage);
      if (tt.expectedType === Error) expect(caught).toBe(tt.error);
    });
  }
});
