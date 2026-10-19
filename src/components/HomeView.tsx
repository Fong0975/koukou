"use client";

import { useBackup } from "@/hooks/useBackup";
import { useHomeDialogs } from "@/hooks/useHomeDialogs";
import { useLookups } from "@/hooks/useLookups";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { AllSubscriptionsModal } from "./AllSubscriptionsModal";
import { CalendarSection } from "./CalendarSection";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ConfirmImportDialog } from "./ConfirmImportDialog";
import { Header } from "./Header";
import { SubscriptionFormModal } from "./SubscriptionFormModal";

/**
 * Client-side home screen: wires the data hooks to the calendar, the subscription list dialog,
 * the add/edit form, the delete dialog and the backup menu with its import confirmation.
 */
export function HomeView() {
  const subscriptions = useSubscriptions();
  const lookups = useLookups();
  const dialogs = useHomeDialogs();
  const backup = useBackup();
  const { editing } = dialogs;

  const retry = () => void subscriptions.reload();

  const handleSubmit = (input: SubscriptionInput) =>
    editing ? subscriptions.update(editing.id, input) : subscriptions.create(input);

  const confirmImport = async () => {
    await backup.confirmImport();
    void subscriptions.reload();
    void lookups.reload();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 pb-16 sm:px-6">
      <Header onOpenList={dialogs.openList} onExport={backup.exportBackup} onImportFile={backup.selectFile} />

      <main className="mt-8">
        <CalendarSection
          items={subscriptions.items}
          status={subscriptions.status}
          loadError={subscriptions.loadError}
          onRetry={retry}
        />
      </main>

      {/* Rendered as siblings, not nested, so the form and the confirmation stack above the list dialog. */}
      {dialogs.listOpen && (
        <AllSubscriptionsModal
          items={subscriptions.items}
          status={subscriptions.status}
          loadError={subscriptions.loadError}
          onRetry={retry}
          onAdd={dialogs.openNew}
          onEdit={dialogs.openEdit}
          onDelete={dialogs.openDelete}
          onClose={dialogs.closeList}
        />
      )}

      {dialogs.formOpen && (
        <SubscriptionFormModal
          key={editing?.id ?? "new"}
          initial={editing}
          categories={lookups.categories}
          paymentMethods={lookups.paymentMethods}
          onAddCategory={lookups.addCategory}
          onAddPaymentMethod={lookups.addPaymentMethod}
          onSubmit={handleSubmit}
          onClose={dialogs.closeForm}
        />
      )}

      {dialogs.deleting && (
        <ConfirmDeleteDialog item={dialogs.deleting} onConfirm={subscriptions.remove} onClose={dialogs.closeDelete} />
      )}

      {backup.pendingImport && (
        <ConfirmImportDialog pending={backup.pendingImport} onConfirm={confirmImport} onClose={backup.closeImport} />
      )}
    </div>
  );
}
