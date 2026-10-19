"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_SLOTS, chartColor } from "@/lib/chartColors";
import { formatPercent } from "@/lib/format";
import { foldGroupShares, type GroupShare } from "@/lib/yearReport";
import { ConvertedAmounts } from "../ConvertedAmounts";
import { IconLabel } from "../IconLabel";
import { TOOLTIP_STYLE, formatChartTwd, toChartValue } from "./chartTheme";
import { RatesPending } from "./RatesPending";
import { ReportSection } from "./ReportSection";

interface DistributionChartProps {
  title: string;
  groups: GroupShare[];
}

/**
 * Donut chart of how the year's spending splits across groups, such as categories, above a legend listing each
 * group's total and share. Groups beyond the chart's hues are merged into "其他". The donut is hidden from screen
 * readers, since the legend carries the same figures.
 *
 * @param props.title - Section heading, also the legend's accessible name.
 * @param props.groups - The groups, in display order; the donut waits for rates while any lacks a TWD total.
 */
export function DistributionChart({ title, groups }: DistributionChartProps) {
  const shown = foldGroupShares(groups, CHART_SLOTS);
  const converted = shown.every((group) => group.twdCents !== null);

  return (
    <ReportSection title={title}>
      {converted ? (
        <div aria-hidden="true" className="h-44">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 176 }}>
            <PieChart>
              <Pie
                data={shown.map((group) => ({ name: group.label, twd: toChartValue(group.twdCents ?? 0) }))}
                dataKey="twd"
                nameKey="name"
                startAngle={90}
                endAngle={-270}
                innerRadius="62%"
                outerRadius="95%"
                stroke="#fff"
                strokeWidth={2}
              >
                {shown.map((group, slot) => (
                  <Cell key={group.key} fill={chartColor(slot)} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatChartTwd(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <RatesPending />
      )}
      <ul aria-label={title} className="mt-3 flex flex-col gap-1.5">
        {shown.map((group, slot) => (
          <li key={group.key} className="flex items-start justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 break-words">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: chartColor(slot) }}
              />
              <span>
                <IconLabel icon={group.icon} label={group.label} />
              </span>
            </span>
            <span className="flex shrink-0 items-start gap-2">
              <ConvertedAmounts totals={group.totals} twdCents={group.twdCents} layout="popup" />
              {converted && (
                <span className="w-10 text-right font-num text-ink-soft tabular-nums">
                  {formatPercent(group.share)}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </ReportSection>
  );
}
