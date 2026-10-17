import type { ReactNode } from "react";
import type { Currency } from "@/generated/prisma/enums";
import { CoinMark } from "./CoinMark";

interface CoinListItemProps {
  currency: Currency;
  title: string;
  /** Secondary line under the title. */
  subtitle: ReactNode;
  /** Amount column on the right. */
  children: ReactNode;
}

/**
 * One row of a money list: a currency coin, a title with a secondary line, and the amount on the right.
 *
 * @param props.currency - Currency shown by the coin.
 * @param props.title - Main label, e.g. the subscription name.
 * @param props.subtitle - Secondary line, e.g. category and days.
 * @param props.children - The right-hand amount.
 */
export function CoinListItem({ currency, title, subtitle, children }: CoinListItemProps) {
  return (
    <li className="flex items-center gap-3 py-3">
      <CoinMark currency={currency} />
      <div className="min-w-0 flex-1">
        <p className="truncate">{title}</p>
        <p className="truncate text-sm text-ink-soft">{subtitle}</p>
      </div>
      <div className="shrink-0 text-right font-num tabular-nums">{children}</div>
    </li>
  );
}
