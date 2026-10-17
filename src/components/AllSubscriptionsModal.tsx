"use client";

import { PlusIcon } from "./Icons";
import { Modal } from "./Modal";
import { SubscriptionList, type SubscriptionListProps } from "./SubscriptionList";

interface AllSubscriptionsModalProps extends SubscriptionListProps {
  onClose: () => void;
}

/**
 * Dialog listing every subscription by category, where they are added, edited and deleted.
 * The add/edit form and the delete confirmation open on top of it.
 *
 * @param props.onClose - Closes the dialog.
 */
export function AllSubscriptionsModal({ onClose, ...listProps }: AllSubscriptionsModalProps) {
  // The empty state has its own "add first" button, so the header button only shows once there is a list.
  const showAdd = listProps.items.length > 0;

  return (
    <Modal
      title="所有扣款"
      onClose={onClose}
      widthClass="max-w-3xl"
      actions={
        showAdd && (
          <button type="button" className="btn btn-primary" onClick={listProps.onAdd}>
            <PlusIcon />
            新增扣款
          </button>
        )
      }
    >
      <SubscriptionList {...listProps} />
    </Modal>
  );
}
