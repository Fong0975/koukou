/**
 * Stands in for a Prisma Decimal read from a DECIMAL column, enough for the mappers to serialize it.
 *
 * @param value - The amount.
 */
export const decimal = (value: number) => ({ toFixed: (digits: number) => value.toFixed(digits) });
