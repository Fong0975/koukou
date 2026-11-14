import type { ReactNode } from "react";

interface MoneyListItemProps {
  title: string;
  /** Secondary line under the title. */
  subtitle: ReactNode;
  /** Amount column on the right. */
  children: ReactNode;
}

/**
 * One row of a money list: a title with a secondary line, and the amount on the right.
 *
 * @param props.title - Main label, e.g. the subscription name.
 * @param props.subtitle - Secondary line, e.g. category and days.
 * @param props.children - The right-hand amount.
 */
export function MoneyListItem({ title, subtitle, children }: MoneyListItemProps) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="break-words">{title}</p>
        <p className="text-sm break-words text-ink-soft">{subtitle}</p>
      </div>
      <div className="shrink-0 self-start text-right font-num tabular-nums">{children}</div>
    </li>
  );
}
