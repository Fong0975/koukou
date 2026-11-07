"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import type { SubscriptionDto } from "@/types/dto";

/** Loading state of a remote list. */
export type LoadStatus = "loading" | "ready" | "error";

type FetchResult = { items: SubscriptionDto[] } | { error: string };

/** Fetches the subscription list and reports failure as a value so callers can apply it to state. */
async function fetchSubscriptions(): Promise<FetchResult> {
  try {
    return { items: await apiRequest<SubscriptionDto[]>("/api/subscriptions") };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "讀取失敗" };
  }
}

/**
 * Loads subscriptions from the API and keeps the local list in sync after mutations.
 * Mutations throw ApiClientError so callers can show field errors.
 */
export function useSubscriptions() {
  const [items, setItems] = useState<SubscriptionDto[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyResult = useCallback((result: FetchResult) => {
    if ("items" in result) {
      setItems(result.items);
      setStatus("ready");
    } else {
      setLoadError(result.error);
      setStatus("error");
    }
  }, []);

  const reload = useCallback(async () => {
    setStatus("loading");
    applyResult(await fetchSubscriptions());
  }, [applyResult]);

  useEffect(() => {
    let cancelled = false;
    void fetchSubscriptions().then((result) => {
      if (!cancelled) applyResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applyResult]);

  const create = useCallback(async (input: SubscriptionInput) => {
    const created = await apiRequest<SubscriptionDto>("/api/subscriptions", { method: "POST", body: input });
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: number, input: SubscriptionInput) => {
    const updated = await apiRequest<SubscriptionDto>(`/api/subscriptions/${id}`, { method: "PUT", body: input });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiRequest<void>(`/api/subscriptions/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, status, loadError, reload, create, update, remove };
}
