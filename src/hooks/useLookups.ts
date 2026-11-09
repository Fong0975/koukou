"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { moveId } from "@/lib/moveId";
import { sortPaymentMethods } from "@/lib/paymentMethodOrder";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { CategoryDto, PaymentMethodDto } from "@/types/dto";

/** Fetches both option lists. */
const fetchLookups = () =>
  Promise.all([apiRequest<CategoryDto[]>("/api/categories"), apiRequest<PaymentMethodDto[]>("/api/payment-methods")]);

const logLoadError = (error: unknown) => console.error("[koukou] Failed to load form options:", error);

/**
 * Loads the category and payment method option lists used by the subscription form,
 * and lets the form add new entries on the fly. Categories can also be renamed, deleted and reordered.
 * Payment methods stay ordered by type, then name.
 * `reload` fetches both lists again, e.g. after a backup replaced them.
 */
export function useLookups() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);

  const apply = useCallback(([loadedCategories, loadedPaymentMethods]: [CategoryDto[], PaymentMethodDto[]]) => {
    setCategories(loadedCategories);
    setPaymentMethods(sortPaymentMethods(loadedPaymentMethods));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchLookups()
      .then((lists) => {
        if (!cancelled) apply(lists);
      })
      .catch(logLoadError);
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const reload = useCallback(() => fetchLookups().then(apply).catch(logLoadError), [apply]);

  const addCategory = useCallback(async (input: CategoryInput) => {
    const created = await apiRequest<CategoryDto>("/api/categories", { method: "POST", body: input });
    setCategories((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
    return created;
  }, []);

  const updateCategory = useCallback(async (id: number, input: CategoryInput) => {
    const updated = await apiRequest<CategoryDto>(`/api/categories/${id}`, { method: "PUT", body: input });
    setCategories((prev) => prev.map((category) => (category.id === id ? updated : category)));
    return updated;
  }, []);

  const removeCategory = useCallback(async (id: number) => {
    await apiRequest<void>(`/api/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, []);

  const moveCategory = useCallback(
    async (id: number, offset: -1 | 1) => {
      const ids = moveId(
        categories.map((category) => category.id),
        id,
        offset,
      );
      if (!ids) return;
      setCategories(await apiRequest<CategoryDto[]>("/api/categories/order", { method: "PUT", body: { ids } }));
    },
    [categories],
  );

  const addPaymentMethod = useCallback(async (input: PaymentMethodInput) => {
    const created = await apiRequest<PaymentMethodDto>("/api/payment-methods", { method: "POST", body: input });
    setPaymentMethods((prev) => sortPaymentMethods([...prev, created]));
    return created;
  }, []);

  return {
    categories,
    paymentMethods,
    reload,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    addPaymentMethod,
  };
}
