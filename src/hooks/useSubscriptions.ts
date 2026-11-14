"use client";

import { useCallback } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import type { SubscriptionDto } from "@/types/dto";
import { useApiResource } from "./useApiResource";

const fetchSubscriptions = () => apiRequest<SubscriptionDto[]>("/api/subscriptions");

const NO_SUBSCRIPTIONS: SubscriptionDto[] = [];

/**
 * Loads subscriptions from the API and keeps the local list in sync after mutations.
 * Mutations throw ApiClientError so callers can show field errors.
 */
export function useSubscriptions() {
  const {
    data: items,
    status,
    loadError,
    reload,
    setData: setItems,
  } = useApiResource(fetchSubscriptions, NO_SUBSCRIPTIONS, "subscriptions");

  const create = useCallback(
    async (input: SubscriptionInput) => {
      const created = await apiRequest<SubscriptionDto>("/api/subscriptions", { method: "POST", body: input });
      setItems((prev) => [created, ...prev]);
      return created;
    },
    [setItems],
  );

  const update = useCallback(
    async (id: number, input: SubscriptionInput) => {
      const updated = await apiRequest<SubscriptionDto>(`/api/subscriptions/${id}`, { method: "PUT", body: input });
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [setItems],
  );

  const remove = useCallback(
    async (id: number) => {
      await apiRequest<void>(`/api/subscriptions/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [setItems],
  );

  return { items, status, loadError, reload, create, update, remove };
}
