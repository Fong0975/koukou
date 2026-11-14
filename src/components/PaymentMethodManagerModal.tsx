"use client";

import { useId } from "react";
import { useLookupManagerState } from "@/hooks/useLookupManagerState";
import { PAYMENT_TYPE_LABELS } from "@/lib/labels";
import { groupPaymentMethodsByType } from "@/lib/paymentMethodOrder";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { LookupManagerList } from "./LookupManagerList";
import { ManagerModal } from "./ManagerModal";
import { PaymentMethodEditForm } from "./PaymentMethodEditForm";
import { PaymentMethodManagerRow } from "./PaymentMethodManagerRow";
import { PaymentMethodQuickAdd } from "./PaymentMethodQuickAdd";

interface PaymentMethodManagerModalProps {
  paymentMethods: PaymentMethodDto[];
  /** Ids of the payment methods some subscription uses; these cannot be deleted. */
  usedPaymentMethodIds: ReadonlySet<number>;
  onCreate: (input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  onUpdate: (id: number, input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  onDelete: (id: number) => Promise<void>;
  onMove: (id: number, offset: -1 | 1) => Promise<void>;
  onClose: () => void;
}

/**
 * Dialog for adding, editing, reordering and deleting payment methods, listed in one section per type.
 * Payment methods in use can be edited but not deleted.
 */
export function PaymentMethodManagerModal({
  paymentMethods,
  usedPaymentMethodIds,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  onClose,
}: PaymentMethodManagerModalProps) {
  const state = useLookupManagerState<PaymentMethodDto>(onMove);
  const headingIdPrefix = useId();

  return (
    <ManagerModal
      title="管理扣款方式"
      addLabel="新增扣款方式"
      renderAddForm={(close) => <PaymentMethodQuickAdd onCreate={onCreate} onDone={close} />}
      isEmpty={paymentMethods.length === 0}
      emptyText="還沒有任何扣款方式。"
      error={state.moveError}
      onClose={onClose}
      confirm={
        state.deleting && (
          <ConfirmDeleteDialog
            item={state.deleting}
            message="刪除後，這個扣款方式會從選單中移除，無法復原。"
            onConfirm={onDelete}
            onClose={state.stopDeleting}
          />
        )
      }
    >
      <div className="grid gap-5">
        {groupPaymentMethodsByType(paymentMethods).map(({ type, methods }) => {
          const headingId = `${headingIdPrefix}-${type}`;
          return (
            <section key={type} aria-labelledby={headingId}>
              <h3 id={headingId} className="mb-2.5 px-1 text-leaf-800">
                {PAYMENT_TYPE_LABELS[type]}
              </h3>
              <LookupManagerList
                items={methods}
                usedIds={usedPaymentMethodIds}
                state={state}
                renderEditForm={(paymentMethod, done) => (
                  <PaymentMethodEditForm paymentMethod={paymentMethod} onSave={onUpdate} onDone={done} />
                )}
                renderRow={(paymentMethod, controls) => (
                  <PaymentMethodManagerRow paymentMethod={paymentMethod} {...controls} />
                )}
              />
            </section>
          );
        })}
      </div>
    </ManagerModal>
  );
}
