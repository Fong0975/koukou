"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { sortPaymentMethods } from "@/lib/paymentMethodOrder";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { CategoryDto, PaymentMethodDto } from "@/types/dto";

/**
 * Loads the category and payment method option lists used by the subscription form,
 * and lets the form add new entries on the fly. Payment methods stay ordered by type, then name.
 */
export function useLookups() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiRequest<CategoryDto[]>("/api/categories"), apiRequest<PaymentMethodDto[]>("/api/payment-methods")])
      .then(([loadedCategories, loadedPaymentMethods]) => {
        if (cancelled) return;
        setCategories(loadedCategories);
        setPaymentMethods(sortPaymentMethods(loadedPaymentMethods));
      })
      .catch((error) => console.error("[koukou] Failed to load form options:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const addCategory = useCallback(async (input: CategoryInput) => {
    const created = await apiRequest<CategoryDto>("/api/categories", { method: "POST", body: input });
    setCategories((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
    return created;
  }, []);

  const addPaymentMethod = useCallback(async (input: PaymentMethodInput) => {
    const created = await apiRequest<PaymentMethodDto>("/api/payment-methods", { method: "POST", body: input });
    setPaymentMethods((prev) => sortPaymentMethods([...prev, created]));
    return created;
  }, []);

  return { categories, paymentMethods, addCategory, addPaymentMethod };
}
