import type { CSSProperties } from "react";
import { formatCents } from "@/lib/format";

/** Axis labels: small and recessive, in the soft ink. */
export const AXIS_TICK = { fontSize: 12, fill: "var(--color-ink-soft)" };

/** Hover tooltips, styled like the app's `.popup`. */
export const TOOLTIP_STYLE: CSSProperties = {
  border: "1px solid rgb(78 154 74 / 0.2)",
  borderRadius: "0.75rem",
  background: "rgb(255 255 255 / 0.95)",
  boxShadow: "0 12px 28px -14px rgb(42 90 44 / 0.45)",
  color: "var(--color-ink)",
  fontSize: "0.75rem",
};

/**
 * Formats a charted value, which is in whole TWD dollars, for a tooltip.
 *
 * @param value - The value recharts hands the tooltip.
 */
export function formatChartTwd(value: unknown): string {
  return formatCents("TWD", Math.round(Number(value) * 100));
}

/**
 * Converts TWD cents to the whole-dollar values the charts plot, so axis ticks read as plain amounts.
 *
 * @param twdCents - The amount in whole cents.
 */
export function toChartValue(twdCents: number): number {
  return twdCents / 100;
}
