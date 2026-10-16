/**
 * Builds an error shaped like Prisma's known-request error for service tests.
 *
 * @param code - Prisma error code, e.g. "P2002".
 * @returns An Error carrying the given `code`.
 */
export function prismaError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}
