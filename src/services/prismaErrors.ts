import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

/** User-facing messages for the Prisma error codes the services translate. */
export interface PrismaErrorMessages {
  notFound?: string;
  conflict?: string;
  foreignKey?: string;
}

/**
 * Reads a Prisma known-request error code without importing the runtime class,
 * keeping this helper usable in tests that mock the client.
 */
function getPrismaCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error as { code: unknown };
    return typeof code === "string" && /^P\d{4}$/.test(code) ? code : undefined;
  }
  return undefined;
}

/**
 * Translates well-known Prisma errors into domain errors; anything else is rethrown untouched.
 *
 * - P2025 (record not found) → NotFoundError
 * - P2002 (unique constraint) → ConflictError
 * - P2003 (foreign key constraint) → ValidationError
 *
 * @param error - The caught error.
 * @param messages - Messages for each translated case; a case without a message is rethrown as-is.
 * @throws Always.
 */
export function rethrowPrismaError(error: unknown, messages: PrismaErrorMessages): never {
  const code = getPrismaCode(error);
  if (code === "P2025" && messages.notFound) throw new NotFoundError(messages.notFound);
  if (code === "P2002" && messages.conflict) throw new ConflictError(messages.conflict);
  if (code === "P2003" && messages.foreignKey) throw new ValidationError(messages.foreignKey);
  throw error;
}
