import type { ReactNode } from "react";

/** A titled block of the month summary's subtotals, e.g. per category or per payment method. */
export function TotalsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm text-ink-soft">{title}</h3>
      {children}
    </div>
  );
}
