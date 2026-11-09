import { currencyEntries, type CurrencyTotals } from "../billingSummary";
import { formatCents } from "../format";
import type { MonthlySummary, NamedTotal } from "./dueReminders";
import { formatMessageDate } from "./messageDate";
import { capList, fitToLimit, joinBlocks, moreText } from "./messageLayout";

/** Formats totals per currency, e.g. "NT$ 1,290 + US$ 20.00"; the currencies are never converted into one. */
function totalsText(totals: CurrencyTotals): string {
  return currencyEntries(totals)
    .map(([currency, cents]) => formatCents(currency, cents))
    .join(" + ");
}

/**
 * Lines of a summary total: its amounts, then the names it is made of.
 *
 * @param label - What the total is, e.g. "本月扣款".
 * @param total - The total and its subscription names.
 * @param cap - Most names to show.
 */
function namedTotalLines(label: string, { totals, names }: NamedTotal, cap: number): string[] {
  if (names.length === 0) return [`・${label}：無`];
  const { shown, hidden } = capList(names, cap);
  const nameText = [...shown, ...(hidden ? [moreText(hidden)] : [])].join("、");
  return [`・${label}：${totalsText(totals)}`, `  ${nameText}`];
}

/**
 * Renders the summary with every list cut to at most `cap` items.
 *
 * @param summary - The month's summary.
 * @param cap - Most items any of its lists shows.
 */
function renderSummary(summary: MonthlySummary, cap: number): string {
  const { shown, hidden } = capList(summary.expiries, cap);
  const expiryLines =
    summary.expiries.length === 0
      ? ["・本月到期：無"]
      : [
          `・本月到期 (${summary.expiries.length} 項)`,
          ...shown.map(({ date, subscription }) => `  ${formatMessageDate(date)} ${subscription.name}`),
          ...(hidden ? [`  ${moreText(hidden)}`] : []),
        ];
  return [
    `📅 ${summary.month.month} 月摘要`,
    ...joinBlocks([
      expiryLines,
      namedTotalLines("本月預扣", summary.reserve, cap),
      namedTotalLines("本月扣款", summary.charge, cap),
    ]),
  ].join("\n");
}

/**
 * Builds the monthly summary as a LINE text message of its own. When it would exceed the length LINE
 * allows, every list is cut to the most items that still fit and ends with "…另 N 項".
 *
 * @param summary - The month's summary.
 * @returns The message, or null when there is no summary to send.
 */
export function buildSummaryMessage(summary: MonthlySummary | null): string | null {
  if (summary === null) return null;
  const longestList = Math.max(summary.expiries.length, summary.reserve.names.length, summary.charge.names.length);
  return fitToLimit((cap) => renderSummary(summary, cap), longestList);
}
