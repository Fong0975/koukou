import type { ApiErrorDetail } from "@/lib/http/apiResponse";

/** Error raised by {@link apiRequest}, carrying the server's error envelope. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Options for {@link apiRequest}. */
export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

/**
 * Calls a KouKou API endpoint and unwraps the `{ data }` envelope.
 *
 * @param path - Endpoint path, e.g. "/api/subscriptions".
 * @param options - HTTP method and JSON body.
 * @returns The `data` payload, or undefined for 204 responses.
 * @throws ApiClientError for network failures and non-2xx responses.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError("連不上伺服器，請確認網路連線後再試一次", 0, "NETWORK_ERROR");
  }

  if (response.status === 204) return undefined as T;

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const error = json?.error;
    throw new ApiClientError(
      error?.message ?? `請求失敗（HTTP ${response.status}）`,
      response.status,
      error?.code ?? "UNKNOWN",
      error?.details ?? [],
    );
  }
  return json?.data as T;
}
