"use client";

import { useMemo } from "react";
import { useBackup } from "@/hooks/useBackup";
import { useHomeDialogs } from "@/hooks/useHomeDialogs";
import { useLookups } from "@/hooks/useLookups";
import { useNotificationSetting } from "@/hooks/useNotificationSetting";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useToday } from "@/hooks/useToday";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { AllSubscriptionsModal } from "./AllSubscriptionsModal";
import { CalendarSection } from "./CalendarSection";
import { CategoryManagerModal } from "./CategoryManagerModal";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ConfirmImportDialog } from "./ConfirmImportDialog";
import { Header } from "./Header";
import { NotificationSettingsModal } from "./NotificationSettingsModal";
import { YearReportModal } from "./report/YearReportModal";
import { SubscriptionFormModal } from "./SubscriptionFormModal";

/**
 * Client-side home screen: wires the data hooks to the calendar, the subscription list dialog,
 * the add/edit form, the delete dialog, the category manager, the annual report, the notification settings and the backup menu with
 * its import confirmation.
 */
export function HomeView() {
  const subscriptions = useSubscriptions();
  const lookups = useLookups();
  const dialogs = useHomeDialogs();
  const backup = useBackup();
  const today = useToday();
  const notification = useNotificationSetting();
  const { editing } = dialogs;

  const retry = () => void subscriptions.reload();

  const handleSubmit = (input: SubscriptionInput) =>
    editing ? subscriptions.update(editing.id, input) : subscriptions.create(input);

  const usedCategoryIds = useMemo(
    () => new Set(subscriptions.items.map((item) => item.category.id)),
    [subscriptions.items],
  );

  // Subscriptions embed their category, so they are reloaded to show the new name or icon.
  const updateCategory = async (id: number, input: CategoryInput) => {
    const updated = await lookups.updateCategory(id, input);
    void subscriptions.reload();
    return updated;
  };

  const confirmImport = async () => {
    await backup.confirmImport();
    void subscriptions.reload();
    void lookups.reload();
    void notification.reload();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 pb-16 sm:px-6">
      <Header
        onOpenList={dialogs.openList}
        onOpenReport={dialogs.openReport}
        onOpenSettings={dialogs.openSettings}
        onExport={backup.exportBackup}
        onImportFile={backup.selectFile}
      />

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
          remindersActive={notification.remindersActive}
          onManageCategories={dialogs.openCategories}
          onClose={dialogs.closeList}
        />
      )}

      {dialogs.categoriesOpen && (
        <CategoryManagerModal
          categories={lookups.categories}
          usedCategoryIds={usedCategoryIds}
          onCreate={lookups.addCategory}
          onUpdate={updateCategory}
          onDelete={lookups.removeCategory}
          onMove={lookups.moveCategory}
          onClose={dialogs.closeCategories}
        />
      )}

      {dialogs.reportOpen && today && (
        <YearReportModal items={subscriptions.items} initialYear={today.year} onClose={dialogs.closeReport} />
      )}

      {dialogs.settingsOpen && (
        <NotificationSettingsModal onClose={dialogs.closeSettings} onSaved={notification.apply} />
      )}

      {dialogs.formOpen && (
        <SubscriptionFormModal
          key={editing?.id ?? "new"}
          initial={editing}
          categories={lookups.categories}
          paymentMethods={lookups.paymentMethods}
          onAddCategory={lookups.addCategory}
          onAddPaymentMethod={lookups.addPaymentMethod}
          remindersActive={notification.remindersActive}
          onSubmit={handleSubmit}
          onClose={dialogs.closeForm}
        />
      )}

      {dialogs.deleting && (
        <ConfirmDeleteDialog
          item={dialogs.deleting}
          message="刪除後，這筆扣款和它的所有扣款日都會一起移除，無法復原。"
          onConfirm={subscriptions.remove}
          onClose={dialogs.closeDelete}
        />
      )}

      {backup.pendingImport && (
        <ConfirmImportDialog pending={backup.pendingImport} onConfirm={confirmImport} onClose={backup.closeImport} />
      )}
    </div>
  );
}
