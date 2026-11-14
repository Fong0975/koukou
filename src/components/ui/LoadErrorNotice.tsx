interface LoadErrorNoticeProps {
  message: string | null;
  onRetry: () => void;
}

/**
 * Alert shown when the subscriptions could not be loaded, with a retry button.
 *
 * @param props.message - The reason the load failed.
 * @param props.onRetry - Loads the subscriptions again.
 */
export function LoadErrorNotice({ message, onRetry }: LoadErrorNoticeProps) {
  return (
    <div role="alert" className="glass mx-auto max-w-md rounded-[1.5rem] p-8 text-center">
      <h2 className="text-lg">讀不到扣款資料</h2>
      <p className="mt-2 text-ink-soft">{message}</p>
      <button type="button" className="btn btn-ghost mt-5" onClick={onRetry}>
        重新讀取
      </button>
    </div>
  );
}
