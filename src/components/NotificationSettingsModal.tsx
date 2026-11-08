"use client";

import { useNotificationSetting } from "@/hooks/useNotificationSetting";
import { Modal } from "./Modal";
import { NotificationSettingsForm } from "./NotificationSettingsForm";

interface NotificationSettingsModalProps {
  onClose: () => void;
}

/**
 * Dialog for the LINE notification settings. Loads them when opened and shows the form once
 * they arrive, or the reason they could not be read with a retry button.
 *
 * @param props.onClose - Closes the dialog.
 */
export function NotificationSettingsModal({ onClose }: NotificationSettingsModalProps) {
  const { setting, loadError, reload, save, sendTest } = useNotificationSetting();

  return (
    <Modal title="通知設定" onClose={onClose}>
      {setting ? (
        <NotificationSettingsForm setting={setting} onSave={save} onSendTest={sendTest} onClose={onClose} />
      ) : loadError ? (
        <div role="alert" className="text-center">
          <p className="text-ink-soft">{loadError}</p>
          <button type="button" className="btn btn-ghost mt-4" onClick={() => void reload()}>
            重新讀取
          </button>
        </div>
      ) : (
        <p className="text-center text-ink-soft">讀取中…</p>
      )}
    </Modal>
  );
}
