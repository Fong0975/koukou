import { type AppError, ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger("prismaErrors");

/** User-facing messages for the Prisma error codes the services translate. */
export interface PrismaErrorMessages {
  notFound?: string;
  conflict?: string;
  foreignKey?: string;
}

/** Which domain error each translated Prisma code becomes, and which message it uses. */
const TRANSLATIONS: Record<string, { key: keyof PrismaErrorMessages; ErrorType: new (message: string) => AppError }> = {
  P2025: { key: "notFound", ErrorType: NotFoundError },
  P2002: { key: "conflict", ErrorType: ConflictError },
  P2003: { key: "foreignKey", ErrorType: ValidationError },
};

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
  const translation = code === undefined ? undefined : TRANSLATIONS[code];
  const message = translation && messages[translation.key];
  if (!translation || !message) throw error;

  const domainError = new translation.ErrorType(message);
  logger.debug("Prisma error translated", { prisma_code: code, code: domainError.code });
  throw domainError;
}
