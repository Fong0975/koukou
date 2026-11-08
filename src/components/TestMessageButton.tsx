"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";

interface TestMessageButtonProps {
  onSendTest: () => Promise<void>;
  /** Disables the button, e.g. while LINE is not set up on the server. */
  disabled?: boolean;
}

/**
 * Sends a LINE test message and reports in place whether it went out or why it failed.
 *
 * @param props.onSendTest - Sends the test message.
 * @param props.disabled - Whether sending is unavailable.
 */
export function TestMessageButton({ onSendTest, disabled = false }: TestMessageButtonProps) {
  const [sent, setSent] = useState(false);
  const { pending, error, run } = useAsyncAction(async () => {
    setSent(false);
    await onSendTest();
    setSent(true);
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-soft" disabled={disabled || pending} onClick={() => void run()}>
          {pending ? "傳送中…" : "傳送測試訊息"}
        </button>
        {sent && !pending && (
          <p role="status" className="text-sm text-leaf-800">
            已送出，請到 LINE 查看
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
