"use client";

import { useCallback, useState } from "react";
import { ApiClientError } from "@/lib/apiClient";

/** State and runner returned by {@link useAsyncAction}. */
export interface AsyncAction<A extends unknown[], R> {
  pending: boolean;
  error: string | null;
  /** The last ApiClientError, exposing field-level details. */
  apiError: ApiClientError | null;
  run: (...args: A) => Promise<R | undefined>;
  reset: () => void;
}

/**
 * Tracks pending/error state of an async action such as a form submission.
 * Errors are captured instead of thrown; `run` resolves to undefined on failure.
 *
 * @param action - The async function to run.
 */
export function useAsyncAction<A extends unknown[], R>(action: (...args: A) => Promise<R>): AsyncAction<A, R> {
  const [pending, setPending] = useState(false);
  const [apiError, setApiError] = useState<ApiClientError | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: A) => {
      setPending(true);
      setError(null);
      setApiError(null);
      try {
        return await action(...args);
      } catch (caught) {
        setApiError(caught instanceof ApiClientError ? caught : null);
        setError(caught instanceof Error ? caught.message : "發生未知錯誤");
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  const reset = useCallback(() => {
    setError(null);
    setApiError(null);
  }, []);

  return { pending, error, apiError, run, reset };
}
