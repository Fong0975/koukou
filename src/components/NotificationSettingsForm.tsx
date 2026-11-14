"use client";

import { useState, type FormEvent } from "react";
import { useReportUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useValidatedSubmit } from "@/hooks/useValidatedSubmit";
import {
  notificationSettingInputSchema,
  type NotificationSettingInput,
} from "@/lib/validation/notificationSettingSchema";
import type { NotificationSettingDto } from "@/types/dto";
import { CheckboxCard } from "./CheckboxCard";
import { TestMessageButton } from "./TestMessageButton";

interface NotificationSettingsFormProps {
  setting: NotificationSettingDto;
  onSave: (input: NotificationSettingInput) => Promise<unknown>;
  onSendTest: () => Promise<void>;
  onClose: () => void;
}

/**
 * Edits the LINE notification switches and send time, with a button to send a test message.
 * Saving closes the dialog. Reports to the enclosing dialog whether the values differ from the loaded ones.
 *
 * @param props.setting - The loaded settings.
 * @param props.onSave - Saves the edited settings.
 * @param props.onSendTest - Sends a LINE test message.
 * @param props.onClose - Closes the dialog.
 */
export function NotificationSettingsForm({ setting, onSave, onSendTest, onClose }: NotificationSettingsFormProps) {
  const [values, setValues] = useState<NotificationSettingInput>({
    enabled: setting.enabled,
    monthlySummaryEnabled: setting.monthlySummaryEnabled,
    sendTime: setting.sendTime,
  });
  useReportUnsavedChanges(
    values.enabled !== setting.enabled ||
      values.monthlySummaryEnabled !== setting.monthlySummaryEnabled ||
      values.sendTime !== setting.sendTime,
  );
  const saving = useValidatedSubmit(notificationSettingInputSchema, async (input: NotificationSettingInput) => {
    await onSave(input);
    onClose();
  });

  const set = <K extends keyof NotificationSettingInput>(key: K, value: NotificationSettingInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await saving.submit(values);
  };

  const sendTimeError = saving.fieldErrors.sendTime;
  const formError = saving.error && !sendTimeError ? saving.error : null;
  // The main switch gates every reminder, so its options are locked while it is off or LINE is not set up.
  const optionsLocked = !setting.lineConfigured || !values.enabled;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {!setting.lineConfigured && (
        <p role="alert" className="text-sm text-berry">
          伺服器尚未設定 LINE（LINE_CHANNEL_ACCESS_TOKEN、LINE_USER_ID），設定完成並重新啟動前不會送出任何通知。
        </p>
      )}

      <CheckboxCard
        label="啟用 LINE 通知"
        hint="每天在傳送時間把當日的提醒整合成一則訊息；在傳送時間過後才開啟時，從隔天開始傳送"
        checked={values.enabled}
        disabled={!setting.lineConfigured}
        onChange={(checked) => set("enabled", checked)}
      />
      <CheckboxCard
        label="每月摘要"
        hint="每月 1 日附上本月到期項目、預扣總額與扣款總額"
        checked={values.monthlySummaryEnabled}
        disabled={optionsLocked}
        onChange={(checked) => set("monthlySummaryEnabled", checked)}
      />

      <div>
        <label htmlFor="notify-send-time" className="field-label">
          傳送時間
        </label>
        <input
          id="notify-send-time"
          type="time"
          className="field font-num"
          value={values.sendTime}
          disabled={optionsLocked}
          aria-invalid={Boolean(sendTimeError)}
          onChange={(event) => set("sendTime", event.target.value)}
        />
        {sendTimeError ? (
          <p className="field-error">{sendTimeError}</p>
        ) : (
          <p className="field-hint">時區：{setting.timeZone}</p>
        )}
      </div>

      <TestMessageButton onSendTest={onSendTest} disabled={!setting.lineConfigured} />

      {formError && (
        <p role="alert" className="field-error mt-0">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving.pending}>
          {saving.pending ? "儲存中…" : "儲存設定"}
        </button>
      </div>
    </form>
  );
}
