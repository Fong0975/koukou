import { type Mock, vi } from "vitest";

/** Mocks of the Prisma model methods the lookup services call. */
export const tableMock = () => ({ findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() });

/**
 * Builds a Prisma client mock whose interactive transactions run against the mock itself, so a test sets up
 * and checks the same model mocks whether a service writes inside a transaction or not.
 *
 * @param tables - Model mocks keyed by model name, e.g. `{ category: tableMock() }`.
 */
export function transactionalPrismaMock<T extends object>(tables: T) {
  const mock = { ...tables, $transaction: vi.fn() };
  mock.$transaction.mockImplementation((run: (tx: typeof mock) => unknown) => run(mock));
  return mock;
}

/**
 * Lists the `[id, sortOrder]` pairs written through a model's `update` mock, in call order.
 *
 * @param update - The model's `update` mock.
 */
export function sortOrderWrites(update: Mock): [number, number][] {
  return update.mock.calls.map((call) => {
    const args = call[0] as { where: { id: number }; data: { sortOrder: number } };
    return [args.where.id, args.data.sortOrder];
  });
}
