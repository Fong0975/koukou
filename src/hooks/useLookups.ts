"use client";

import { useCallback } from "react";
import { apiRequest } from "@/lib/apiClient";
import { moveId } from "@/lib/form/moveId";
import { movePaymentMethodWithinType, sortPaymentMethods } from "@/lib/lookups/paymentMethodOrder";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { CategoryDto, PaymentMethodDto } from "@/types/dto";
import { useApiResource } from "./useApiResource";

interface Lookups {
  categories: CategoryDto[];
  paymentMethods: PaymentMethodDto[];
}

/** Fetches both option lists; payment methods come back ordered by type, then sortOrder. */
async function fetchLookups(): Promise<Lookups> {
  const [categories, paymentMethods] = await Promise.all([
    apiRequest<CategoryDto[]>("/api/categories"),
    apiRequest<PaymentMethodDto[]>("/api/payment-methods"),
  ]);
  return { categories, paymentMethods: sortPaymentMethods(paymentMethods) };
}

const NO_LOOKUPS: Lookups = { categories: [], paymentMethods: [] };

/**
 * Loads the category and payment method option lists used by the subscription form,
 * and lets the form add new entries on the fly. Categories can also be renamed, deleted and reordered.
 * Payment methods can be edited, deleted and reordered within their type too, and stay ordered by type, then sortOrder.
 * `reload` fetches both lists again, e.g. after a backup replaced them.
 */
export function useLookups() {
  const { data, status, loadError, reload, setData } = useApiResource(fetchLookups, NO_LOOKUPS, "form options");
  const { categories, paymentMethods } = data;

  const setCategories = useCallback(
    (update: (prev: CategoryDto[]) => CategoryDto[]) =>
      setData((prev) => ({ ...prev, categories: update(prev.categories) })),
    [setData],
  );
  const setPaymentMethods = useCallback(
    (update: (prev: PaymentMethodDto[]) => PaymentMethodDto[]) =>
      setData((prev) => ({ ...prev, paymentMethods: sortPaymentMethods(update(prev.paymentMethods)) })),
    [setData],
  );

  const addCategory = useCallback(
    async (input: CategoryInput) => {
      const created = await apiRequest<CategoryDto>("/api/categories", { method: "POST", body: input });
      // Creating may move the "其他" catch-all down a step, so the server's list is the only reliable order.
      const reordered = await apiRequest<CategoryDto[]>("/api/categories");
      setCategories(() => reordered);
      return created;
    },
    [setCategories],
  );

  const updateCategory = useCallback(
    async (id: number, input: CategoryInput) => {
      const updated = await apiRequest<CategoryDto>(`/api/categories/${id}`, { method: "PUT", body: input });
      setCategories((prev) => prev.map((category) => (category.id === id ? updated : category)));
      return updated;
    },
    [setCategories],
  );

  const removeCategory = useCallback(
    async (id: number) => {
      await apiRequest<void>(`/api/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((category) => category.id !== id));
    },
    [setCategories],
  );

  const moveCategory = useCallback(
    async (id: number, offset: -1 | 1) => {
      const ids = moveId(
        categories.map((category) => category.id),
        id,
        offset,
      );
      if (!ids) return;
      const saved = await apiRequest<CategoryDto[]>("/api/categories/order", { method: "PUT", body: { ids } });
      setCategories(() => saved);
    },
    [categories, setCategories],
  );

  const addPaymentMethod = useCallback(
    async (input: PaymentMethodInput) => {
      const created = await apiRequest<PaymentMethodDto>("/api/payment-methods", { method: "POST", body: input });
      setPaymentMethods((prev) => [...prev, created]);
      return created;
    },
    [setPaymentMethods],
  );

  const updatePaymentMethod = useCallback(
    async (id: number, input: PaymentMethodInput) => {
      const updated = await apiRequest<PaymentMethodDto>(`/api/payment-methods/${id}`, {
        method: "PUT",
        body: input,
      });
      setPaymentMethods((prev) => prev.map((method) => (method.id === id ? updated : method)));
      return updated;
    },
    [setPaymentMethods],
  );

  const removePaymentMethod = useCallback(
    async (id: number) => {
      await apiRequest<void>(`/api/payment-methods/${id}`, { method: "DELETE" });
      setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
    },
    [setPaymentMethods],
  );

  const movePaymentMethod = useCallback(
    async (id: number, offset: -1 | 1) => {
      const ids = movePaymentMethodWithinType(paymentMethods, id, offset);
      if (!ids) return;
      const saved = await apiRequest<PaymentMethodDto[]>("/api/payment-methods/order", {
        method: "PUT",
        body: { ids },
      });
      setPaymentMethods(() => saved);
    },
    [paymentMethods, setPaymentMethods],
  );

  return {
    categories,
    paymentMethods,
    status,
    loadError,
    reload,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    movePaymentMethod,
  };
}
