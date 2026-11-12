/**
 * The text content of a reserve's subtitle, which holds both the compact and the full wording, since the
 * test DOM ignores the CSS that shows only one of them.
 *
 * @param year - The charge year.
 * @param progress - The installment out of the total, e.g. "3/12".
 * @param average - The formatted monthly average, e.g. "NT$ 83.3".
 */
export function reserveDetailText(year: number, progress: string, average: string): string {
  return `${year} 年 ${progress} 期 · ${average}/月${year} 年度 · 第 ${progress} 期 · 月均 ${average}`;
}
