"use client";

import { useState } from "react";
import { useBackup } from "@/hooks/useBackup";
import { useHomeDialogs } from "@/hooks/useHomeDialogs";
import { useLookupManagement } from "@/hooks/useLookupManagement";
import { useLookups } from "@/hooks/useLookups";
import { useNotificationSetting } from "@/hooks/useNotificationSetting";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useToday } from "@/hooks/useToday";
import type { SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import { AllSubscriptionsModal } from "./AllSubscriptionsModal";
import { CalendarSection } from "./CalendarSection";
import { CategoryManagerModal } from "./CategoryManagerModal";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ConfirmImportDialog } from "./ConfirmImportDialog";
import { Header } from "./Header";
import { NotificationSettingsModal } from "./NotificationSettingsModal";
import { PaymentMethodManagerModal } from "./PaymentMethodManagerModal";
import { YearReportModal } from "./report/YearReportModal";
import { SubscriptionFormModal } from "./SubscriptionFormModal";

/**
 * Client-side home screen: wires the data hooks to the calendar, the subscription list dialog,
 * the add/edit form, the delete dialog, the category and payment method managers, the annual report, the
 * notification settings and the backup menu with its import confirmation.
 */
export function HomeView() {
  const subscriptions = useSubscriptions();
  const lookups = useLookups();
  const dialogs = useHomeDialogs();
  const backup = useBackup();
  const today = useToday();
  const notification = useNotificationSetting();
  const { editing } = dialogs;
  const [toolbarSlot, setToolbarSlot] = useState<HTMLElement | null>(null);

  const retry = () => void subscriptions.reload();

  const handleSubmit = (input: SubscriptionInput) =>
    editing ? subscriptions.update(editing.id, input) : subscriptions.create(input);

  const management = useLookupManagement(subscriptions.items, subscriptions.reload, lookups);

  const confirmImport = async () => {
    await backup.confirmImport();
    void subscriptions.reload();
    void lookups.reload();
    void notification.reload();
  };

  return (
    <div className="flex h-dvh flex-col pt-3">
      <div className="mx-auto w-full max-w-7xl shrink-0 px-4 sm:px-6">
        <Header
          onOpenList={dialogs.openList}
          onOpenReport={dialogs.openReport}
          onOpenSettings={dialogs.openSettings}
          onExport={backup.exportBackup}
          onImportFile={backup.selectFile}
          toolbarSlotRef={setToolbarSlot}
        />
      </div>

      {/* The only scrolling region, full viewport width so its scrollbar sits at the window edge. */}
      <main className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-16 sm:px-6">
          <CalendarSection
            toolbarSlot={toolbarSlot}
            items={subscriptions.items}
            status={subscriptions.status}
            loadError={subscriptions.loadError}
            onRetry={retry}
          />
        </div>
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
          onManagePaymentMethods={dialogs.openPaymentMethods}
          onClose={dialogs.closeList}
        />
      )}

      {dialogs.categoriesOpen && (
        <CategoryManagerModal
          categories={lookups.categories}
          usedCategoryIds={management.usedCategoryIds}
          onCreate={lookups.addCategory}
          onUpdate={management.saveCategory}
          onDelete={lookups.removeCategory}
          onMove={lookups.moveCategory}
          onClose={dialogs.closeCategories}
        />
      )}

      {dialogs.paymentMethodsOpen && (
        <PaymentMethodManagerModal
          paymentMethods={lookups.paymentMethods}
          usedPaymentMethodIds={management.usedPaymentMethodIds}
          onCreate={lookups.addPaymentMethod}
          onUpdate={management.savePaymentMethod}
          onDelete={lookups.removePaymentMethod}
          onMove={lookups.movePaymentMethod}
          onClose={dialogs.closePaymentMethods}
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
