import { ChevronLeftIcon, ChevronRightIcon } from "../Icons";

interface YearStepperProps {
  year: number;
  onChange: (year: number) => void;
}

/**
 * Steps the reported year back and forth.
 *
 * @param props.year - The shown year.
 * @param props.onChange - Receives the previous or next year.
 */
export function YearStepper({ year, onChange }: YearStepperProps) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" className="icon-btn" onClick={() => onChange(year - 1)} aria-label="上一年">
        <ChevronLeftIcon />
      </button>
      <span className="min-w-[4.5rem] text-center font-num tabular-nums" aria-live="polite">
        {year} 年
      </span>
      <button type="button" className="icon-btn" onClick={() => onChange(year + 1)} aria-label="下一年">
        <ChevronRightIcon />
      </button>
    </div>
  );
}
