"use client";

import { useMemo, useState } from "react";
import type { YearMonth } from "@/lib/calendarMonth";
import { useToday } from "./useToday";

/**
 * Tracks which month the calendar shows, defaulting to the current month in local time.
 *
 * @returns `today` and `cursor` (both null until the client knows the date) and `setCursor` to pick a month;
 *   `setCursor(null)` returns to the current month.
 */
export function useMonthCursor() {
  const today = useToday();
  const [selected, setSelected] = useState<YearMonth | null>(null);

  const cursor = useMemo<YearMonth | null>(
    () => selected ?? (today && { year: today.year, month: today.month }),
    [selected, today],
  );

  return { today, cursor, setCursor: setSelected };
}
