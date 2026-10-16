"use client";

import { useMemo, useSyncExternalStore } from "react";
import { toCalendarDate, type CalendarDate } from "@/lib/calendarMonth";

const subscribe = () => () => {};

/** Packs the local date into a number so the snapshot stays referentially stable between renders. */
const readSnapshot = () => {
  const { year, month, day } = toCalendarDate(new Date());
  return year * 10000 + month * 100 + day;
};

const readServerSnapshot = () => null;

/**
 * Today's date in the browser's time zone.
 * Returns null during server rendering and hydration, because the server's clock and
 * time zone may differ from the visitor's; the real date arrives on the next render.
 */
export function useToday(): CalendarDate | null {
  const packed = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  return useMemo(
    () =>
      packed === null
        ? null
        : { year: Math.floor(packed / 10000), month: Math.floor(packed / 100) % 100, day: packed % 100 },
    [packed],
  );
}
