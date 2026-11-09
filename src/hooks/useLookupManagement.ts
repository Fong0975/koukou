"use client";

import { useCallback, useMemo } from "react";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { CategoryDto, PaymentMethodDto, SubscriptionDto } from "@/types/dto";

/** The part of {@link useLookups} the managers use to save edits. */
interface LookupEditors {
  updateCategory: (id: number, input: CategoryInput) => Promise<CategoryDto>;
  updatePaymentMethod: (id: number, input: PaymentMethodInput) => Promise<PaymentMethodDto>;
}

/**
 * Supports the category and payment method managers: which entries subscriptions use (those cannot
 * be deleted) and edit handlers that reload the subscriptions afterwards, because every subscription
 * embeds its category and payment method and would otherwise keep showing the old name.
 *
 * @param items - The loaded subscriptions.
 * @param reloadSubscriptions - Fetches the subscriptions again.
 * @param lookups - Saves category and payment method edits.
 */
export function useLookupManagement(
  items: SubscriptionDto[],
  reloadSubscriptions: () => unknown,
  { updateCategory, updatePaymentMethod }: LookupEditors,
) {
  const usedCategoryIds = useMemo(() => new Set(items.map((item) => item.category.id)), [items]);
  const usedPaymentMethodIds = useMemo(() => new Set(items.map((item) => item.paymentMethod.id)), [items]);

  const saveCategory = useCallback(
    async (id: number, input: CategoryInput) => {
      const updated = await updateCategory(id, input);
      void reloadSubscriptions();
      return updated;
    },
    [updateCategory, reloadSubscriptions],
  );

  const savePaymentMethod = useCallback(
    async (id: number, input: PaymentMethodInput) => {
      const updated = await updatePaymentMethod(id, input);
      void reloadSubscriptions();
      return updated;
    },
    [updatePaymentMethod, reloadSubscriptions],
  );

  return { usedCategoryIds, usedPaymentMethodIds, saveCategory, savePaymentMethod };
}
