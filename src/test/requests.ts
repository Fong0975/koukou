/**
 * Builds a request for route handler tests.
 *
 * @param method - HTTP method.
 * @param body - Value serialized as JSON, or a raw string sent as-is.
 * @returns A Request targeting a dummy local URL.
 */
export function makeRequest(method: string, body?: unknown): Request {
  const init: RequestInit = { method };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost/api/test", init);
}

/**
 * Builds the Next.js dynamic route context for `[id]` routes.
 *
 * @param id - The raw id segment.
 */
export function idContext(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}
