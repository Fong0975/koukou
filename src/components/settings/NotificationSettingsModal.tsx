"use client";

import type { NotificationSettingInput } from "@/lib/validation/notificationSettingSchema";
import type { NotificationSettingDto } from "@/types/dto";
import { GuardedModal } from "../ui/GuardedModal";
import { NotificationSettingsForm } from "./NotificationSettingsForm";

interface NotificationSettingsModalProps {
  /** The loaded settings, or null while they are loading or failed to load. */
  setting: NotificationSettingDto | null;
  loadError: string | null;
  onReload: () => void;
  onSave: (input: NotificationSettingInput) => Promise<NotificationSettingDto>;
  onSendTest: () => Promise<void>;
  onClose: () => void;
}

/**
 * Dialog for the LINE notification settings the page has loaded. Shows the form once they are there, or
 * the reason they could not be read with a retry button.
 */
export function NotificationSettingsModal({
  setting,
  loadError,
  onReload,
  onSave,
  onSendTest,
  onClose,
}: NotificationSettingsModalProps) {
  return (
    <GuardedModal title="通知設定" onClose={onClose} titleClassName="font-semibold">
      {setting ? (
        <NotificationSettingsForm setting={setting} onSave={onSave} onSendTest={onSendTest} onClose={onClose} />
      ) : loadError ? (
        <div role="alert" className="text-center">
          <p className="text-ink-soft">{loadError}</p>
          <button type="button" className="btn btn-ghost mt-4" onClick={onReload}>
            重新讀取
          </button>
        </div>
      ) : (
        <p className="text-center text-ink-soft">讀取中…</p>
      )}
    </GuardedModal>
  );
}
