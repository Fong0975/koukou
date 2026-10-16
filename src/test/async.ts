/**
 * Waits one macrotask so every pending promise chain (e.g. a mocked API call and the
 * state updates after it) settles. Wrap it in `act` when React state is involved.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
