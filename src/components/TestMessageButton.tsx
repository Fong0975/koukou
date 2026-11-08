"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";

interface TestMessageButtonProps {
  onSendTest: () => Promise<void>;
}

/**
 * Sends a LINE test message and reports in place whether it went out or why it failed.
 *
 * @param props.onSendTest - Sends the test message.
 */
export function TestMessageButton({ onSendTest }: TestMessageButtonProps) {
  const [sent, setSent] = useState(false);
  const { pending, error, run } = useAsyncAction(async () => {
    setSent(false);
    await onSendTest();
    setSent(true);
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => void run()}>
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
