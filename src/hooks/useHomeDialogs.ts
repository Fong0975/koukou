"use client";

import { useState } from "react";
import type { SubscriptionDto } from "@/types/dto";

/** Which form, if any, is open: `null` closed, `"new"` adding, or the item being edited. */
type FormTarget = null | "new" | SubscriptionDto;

/**
 * Open/closed state of the home screen's dialogs: the subscription list, the add/edit form,
 * the delete confirmation, the category and payment method managers, the annual report and the notification settings.
 * They are independent, so the form, the confirmation and the managers can open on top of the list and return to it
 * when closed.
 */
export function useHomeDialogs() {
  const [listOpen, setListOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleting, setDeleting] = useState<SubscriptionDto | null>(null);

  return {
    listOpen,
    openList: () => setListOpen(true),
    closeList: () => setListOpen(false),
    categoriesOpen,
    openCategories: () => setCategoriesOpen(true),
    closeCategories: () => setCategoriesOpen(false),
    paymentMethodsOpen,
    openPaymentMethods: () => setPaymentMethodsOpen(true),
    closePaymentMethods: () => setPaymentMethodsOpen(false),
    formOpen: formTarget !== null,
    /** The item being edited; undefined while adding or when the form is closed. */
    editing: formTarget !== null && formTarget !== "new" ? formTarget : undefined,
    openNew: () => setFormTarget("new"),
    openEdit: (item: SubscriptionDto) => setFormTarget(item),
    closeForm: () => setFormTarget(null),
    deleting,
    openDelete: (item: SubscriptionDto) => setDeleting(item),
    closeDelete: () => setDeleting(null),
    reportOpen,
    openReport: () => setReportOpen(true),
    closeReport: () => setReportOpen(false),
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
  };
}
