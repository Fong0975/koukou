"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCents } from "@/lib/format";
import type { MonthTotal } from "@/lib/yearReport";
import { AXIS_TICK, TOOLTIP_STYLE, formatChartTwd, toChartValue } from "./chartTheme";
import { RatesPending } from "./RatesPending";

interface MonthlyBarChartProps {
  months: MonthTotal[];
  /** The monthly average in TWD cents, drawn as a dashed line; null or 0 draws none. */
  averageTwdCents: number | null;
}

/**
 * Bar chart of the year's twelve monthly totals in TWD, with the monthly average as a reference line. The chart
 * is hidden from screen readers, which get the same figures as a list instead.
 *
 * @param props.months - The twelve monthly totals; any without a TWD total shows the loading placeholder.
 * @param props.averageTwdCents - The monthly average.
 */
export function MonthlyBarChart({ months, averageTwdCents }: MonthlyBarChartProps) {
  if (months.some((month) => month.twdCents === null)) return <RatesPending />;

  const data = months.map(({ month, twdCents }) => ({ label: `${month} 月`, twd: toChartValue(twdCents ?? 0) }));

  return (
    <figure>
      <div aria-hidden="true" className="h-56">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 224 }}>
          <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="rgb(78 154 74 / 0.15)" />
            <XAxis dataKey="label" interval={0} tickLine={false} axisLine={false} tick={AXIS_TICK} />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={(value: number) => value.toLocaleString("en-US")}
            />
            <Tooltip
              cursor={{ fill: "rgb(78 154 74 / 0.08)" }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [formatChartTwd(value), "扣款"]}
            />
            {averageTwdCents !== null && averageTwdCents > 0 && (
              <ReferenceLine
                y={toChartValue(averageTwdCents)}
                stroke="var(--color-ink-soft)"
                strokeDasharray="4 4"
                label={{ value: "平均", position: "insideTopRight", ...AXIS_TICK }}
              />
            )}
            <Bar dataKey="twd" fill="var(--chart-6)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul aria-label="每月扣款" className="sr-only">
        {months.map(({ month, twdCents }) => (
          <li key={month}>
            {month} 月 {formatCents("TWD", twdCents ?? 0)}
          </li>
        ))}
      </ul>
    </figure>
  );
}
