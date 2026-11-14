/** Columns of a category returned by the API, written to backups and loaded with a subscription. */
export const categorySelect = { id: true, name: true, icon: true, sortOrder: true } as const;

/** Columns of a payment method returned by the API, written to backups and loaded with a subscription. */
export const paymentMethodSelect = { id: true, type: true, name: true, note: true, sortOrder: true } as const;
