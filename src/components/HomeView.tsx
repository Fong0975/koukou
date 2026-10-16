"use client";

import { useState } from "react";
import { useLookups } from "@/hooks/useLookups";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import type { SubscriptionDto } from "@/types/dto";
import { CalendarSection } from "./CalendarSection";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { Header } from "./Header";
import { SubscriptionFormModal } from "./SubscriptionFormModal";
import { SubscriptionGrid } from "./SubscriptionGrid";

/** Which form, if any, is open: `null` closed, `"new"` adding, or the item being edited. */
type FormTarget = null | "new" | SubscriptionDto;

/**
 * Client-side home screen: wires the data hooks to the grid, the add/edit form and the delete dialog.
 */
export function HomeView() {
  const subscriptions = useSubscriptions();
  const lookups = useLookups();
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleting, setDeleting] = useState<SubscriptionDto | null>(null);

  const openNew = () => setFormTarget("new");
  const editing = formTarget !== null && formTarget !== "new" ? formTarget : undefined;

  const retry = () => void subscriptions.reload();

  const handleSubmit = (input: SubscriptionInput) =>
    editing ? subscriptions.update(editing.id, input) : subscriptions.create(input);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 pb-16 sm:px-6">
      <Header onAdd={openNew} />

      <main className="mt-8 flex flex-col gap-8">
        <CalendarSection
          items={subscriptions.items}
          status={subscriptions.status}
          loadError={subscriptions.loadError}
          onRetry={retry}
        />
        <SubscriptionGrid
          items={subscriptions.items}
          status={subscriptions.status}
          loadError={subscriptions.loadError}
          onRetry={retry}
          onAdd={openNew}
          onEdit={setFormTarget}
          onDelete={setDeleting}
        />
      </main>

      {formTarget !== null && (
        <SubscriptionFormModal
          key={editing?.id ?? "new"}
          initial={editing}
          categories={lookups.categories}
          paymentMethods={lookups.paymentMethods}
          onAddCategory={lookups.addCategory}
          onAddPaymentMethod={lookups.addPaymentMethod}
          onSubmit={handleSubmit}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleting && (
        <ConfirmDeleteDialog item={deleting} onConfirm={subscriptions.remove} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
