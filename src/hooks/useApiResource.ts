"use client";

import { type SetStateAction, useCallback, useEffect, useRef, useState } from "react";

/** Loading state of a remote resource. */
export type LoadStatus = "loading" | "ready" | "error";

interface ResourceState<T> {
  data: T;
  status: LoadStatus;
  loadError: string | null;
}

type StateUpdate<T> = (prev: ResourceState<T>) => ResourceState<T>;

/**
 * Runs a load and turns its outcome into a state update: the new data, or the previous data with the
 * failure's message, which is also logged.
 *
 * @param load - Fetches the resource.
 * @param label - What is loaded, for the console message.
 */
async function settle<T>(load: () => Promise<T>, label: string): Promise<StateUpdate<T>> {
  try {
    const data = await load();
    return () => ({ data, status: "ready", loadError: null });
  } catch (error) {
    console.error(`[koukou] Failed to load ${label}:`, error);
    const loadError = error instanceof Error ? error.message : "讀取失敗";
    return (prev) => ({ ...prev, status: "error", loadError });
  }
}

/**
 * Loads a resource when mounted and on `reload`. Only the latest request is applied, so a slow earlier
 * response never overwrites a newer one, and nothing is applied after unmount. A failed load keeps the
 * previous data, is logged, and its message becomes `loadError`.
 *
 * @param load - Fetches the resource; must be stable, e.g. defined at module level.
 * @param initial - The data before the first load finishes.
 * @param label - What is loaded, for the console message when it fails, e.g. "subscriptions".
 * @returns The data, its status and error, `reload`, and `setData` to apply local changes after a mutation.
 */
export function useApiResource<T>(load: () => Promise<T>, initial: T, label: string) {
  const [state, setState] = useState<ResourceState<T>>({ data: initial, status: "loading", loadError: null });
  const latestRequest = useRef(0);

  useEffect(() => {
    const request = ++latestRequest.current;
    void settle(load, label).then((update) => {
      if (request === latestRequest.current) setState(update);
    });
    return () => {
      latestRequest.current += 1;
    };
  }, [load, label]);

  const reload = useCallback(async () => {
    const request = ++latestRequest.current;
    setState((prev) => ({ ...prev, status: "loading", loadError: null }));
    const update = await settle(load, label);
    if (request === latestRequest.current) setState(update);
  }, [load, label]);

  const setData = useCallback((update: SetStateAction<T>) => {
    setState((prev) => ({
      ...prev,
      data: typeof update === "function" ? (update as (prev: T) => T)(prev.data) : update,
    }));
  }, []);

  return { data: state.data, status: state.status, loadError: state.loadError, reload, setData };
}
