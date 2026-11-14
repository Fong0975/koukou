"use client";

import { useMemo, useSyncExternalStore } from "react";
import { toCalendarDate, type CalendarDate } from "@/lib/date/calendarMonth";
import { msUntilNextLocalMidnight } from "@/lib/date/dateKey";

/** Delay after midnight before re-reading the date, so a timer firing a little early still sees the new day. */
const MIDNIGHT_MARGIN_MS = 1000;

/**
 * Asks React to re-read the date at every local midnight and whenever the tab comes back into view, since
 * timers in a background tab may be delayed or skipped. The snapshot only changes when the date does.
 */
const subscribe = (onChange: () => void) => {
  let timer: ReturnType<typeof setTimeout>;
  const scheduleMidnight = () => {
    timer = setTimeout(
      () => {
        onChange();
        scheduleMidnight();
      },
      msUntilNextLocalMidnight(new Date()) + MIDNIGHT_MARGIN_MS,
    );
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") onChange();
  };

  scheduleMidnight();
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
};

/** Packs the local date into a number so the snapshot stays referentially stable between renders. */
const readSnapshot = () => {
  const { year, month, day } = toCalendarDate(new Date());
  return year * 10000 + month * 100 + day;
};

const readServerSnapshot = () => null;

/**
 * Today's date in the browser's time zone, kept current across midnight.
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
