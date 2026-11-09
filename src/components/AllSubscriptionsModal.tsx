"use client";

import { PlusIcon } from "./Icons";
import { Modal } from "./Modal";
import { SubscriptionList, type SubscriptionListProps } from "./SubscriptionList";

interface AllSubscriptionsModalProps extends SubscriptionListProps {
  onManageCategories: () => void;
  onManagePaymentMethods: () => void;
  onClose: () => void;
}

/**
 * Dialog listing every subscription by category, where they are added, edited and deleted.
 * A toolbar above the list opens the category and payment method managers. The add/edit form,
 * the delete confirmation and the managers open on top of it.
 *
 * @param props.onManageCategories - Opens the category manager.
 * @param props.onManagePaymentMethods - Opens the payment method manager.
 * @param props.onClose - Closes the dialog.
 */
export function AllSubscriptionsModal({
  onManageCategories,
  onManagePaymentMethods,
  onClose,
  ...listProps
}: AllSubscriptionsModalProps) {
  // The empty state has its own "add first" button, so the header button only shows once there is a list.
  const showAdd = listProps.items.length > 0;

  return (
    <Modal
      title="所有扣款"
      onClose={onClose}
      widthClass="max-w-3xl"
      titleClassName="font-semibold"
      actions={
        showAdd && (
          <button type="button" className="btn btn-primary" onClick={listProps.onAdd}>
            <PlusIcon />
            新增扣款
          </button>
        )
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-soft btn-sm" onClick={onManageCategories}>
          管理類型
        </button>
        <button type="button" className="btn btn-soft btn-sm" onClick={onManagePaymentMethods}>
          管理扣款方式
        </button>
      </div>
      <SubscriptionList {...listProps} />
    </Modal>
  );
}
