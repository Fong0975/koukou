"use client";

import { useId } from "react";
import { todayKey } from "@/lib/date/dateKey";
import type { FieldErrors } from "@/lib/form/fieldErrors";
import { patchRow, removeRow } from "@/lib/form/keyedRows";
import { nextPauseDraft, type PauseDraft } from "@/lib/form/subscriptionDraft";
import { PlusIcon } from "../ui/Icons";
import { RowEditorItem } from "../ui/RowEditorItem";

interface PauseEditorProps {
  /** Subscription start date; a new pause starts no earlier. */
  startDate: string;
  pauses: PauseDraft[];
  onChange: (pauses: PauseDraft[]) => void;
  /** Errors keyed like "pauses.0.startDate", indexed by position in `pauses`. */
  errors: FieldErrors;
}

/**
 * Editable list of the stretches a subscription is paused, each charging again the day after its end date.
 * "新增暫停期間" appends a row starting today, or after the subscription start or the latest pause when those
 * come later, with its end date left to pick.
 */
export function PauseEditor({ startDate, pauses, onChange, errors }: PauseEditorProps) {
  const labelId = useId();
  const patch = (key: string, values: Partial<PauseDraft>) => onChange(patchRow(pauses, key, values));
  const add = () => onChange([...pauses, nextPauseDraft({ startDate, pauses }, todayKey())]);

  return (
    <div>
      <span className="field-label" id={labelId}>
        暫停期間
      </span>
      <p className="text-sm text-ink-soft">暫停期間不扣款，結束日隔天自動恢復；要停止扣款請設定到期日。</p>
      {pauses.length > 0 && (
        <ul aria-labelledby={labelId} className="row-editor-list">
          {pauses.map((pause, index) => {
            const rowLabel = `第 ${index + 1} 段暫停`;
            const startError = errors[`pauses.${index}.startDate`];
            const endError = errors[`pauses.${index}.endDate`];
            return (
              <RowEditorItem
                key={pause.key}
                removeLabel={`移除${rowLabel}`}
                onRemove={() => onChange(removeRow(pauses, pause.key))}
                error={startError ?? endError}
              >
                <input
                  type="date"
                  className="field w-auto font-num"
                  aria-label={`${rowLabel}的開始日`}
                  aria-invalid={Boolean(startError)}
                  min={startDate || undefined}
                  value={pause.startDate}
                  onChange={(event) => patch(pause.key, { startDate: event.target.value })}
                />
                <span className="text-sm text-ink-soft">～</span>
                <input
                  type="date"
                  className="field w-auto font-num"
                  aria-label={`${rowLabel}的結束日`}
                  aria-invalid={Boolean(endError)}
                  min={pause.startDate || undefined}
                  value={pause.endDate}
                  onChange={(event) => patch(pause.key, { endDate: event.target.value })}
                />
              </RowEditorItem>
            );
          })}
        </ul>
      )}
      <button type="button" className="btn btn-ghost mt-3" onClick={add}>
        <PlusIcon />
        新增暫停期間
      </button>
    </div>
  );
}
