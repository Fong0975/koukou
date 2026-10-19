/** Number of categorical chart hues defined in `globals.css` (`--chart-1` … `--chart-8`). */
export const CHART_SLOTS = 8;

/**
 * The categorical hue of a chart slot, as a CSS value usable in SVG `fill` and inline styles.
 *
 * @param slot - 0-based slot, below {@link CHART_SLOTS}; hues are never cycled, so fold extra series first.
 */
export function chartColor(slot: number): string {
  return `var(--chart-${slot + 1})`;
}
