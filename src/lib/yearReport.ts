import type { ExchangeRateDto, SubscriptionDto } from "@/types/dto";
import type { Occurrence } from "./billingOccurrences";
import {
  chargesBySubscription,
  currencyEntries,
  sumByCurrency,
  totalByCurrency,
  type CurrencyTotals,
  type GroupTotal,
} from "./billingSummary";
import { convertedTwdCents, needsExchangeRate } from "./currencyConversion";

/** One month's charges added up, for the monthly chart. */
export interface MonthTotal {
  /** 1–12. */
  month: number;
  totals: CurrencyTotals;
  /** The month's total in TWD cents, or null while its foreign charges cannot be converted yet. */
  twdCents: number | null;
}

/** The year's headline figures. */
export interface YearHighlights {
  totals: CurrencyTotals;
  /** The year's total in TWD cents, or null while its foreign charges cannot be converted yet. */
  twdCents: number | null;
  /** The year's TWD total spread over 12 months, rounded to a whole dollar. */
  monthlyAverageTwdCents: number | null;
  chargeCount: number;
  subscriptionCount: number;
  /** The most expensive month, or null without charges or TWD totals. */
  highest: MonthTotal | null;
  /** The cheapest month that has charges, or null without charges or TWD totals. */
  lowest: MonthTotal | null;
}

/** A group's total and its share of all groups, for a distribution chart. */
export interface GroupShare {
  key: number;
  label: string;
  icon: string | null;
  totals: CurrencyTotals;
  twdCents: number | null;
  /** Fraction (0–1) of the groups' TWD total; 0 while it cannot be converted. */
  share: number;
}

/** A subscription's charges over the year. */
export interface RankedSubscription {
  subscription: SubscriptionDto;
  count: number;
  totals: CurrencyTotals;
  twdCents: number | null;
  /** Fraction (0–1) of the most expensive subscription's TWD total; 0 while it cannot be converted. */
  share: number;
}

const MONTHS = 12;

/**
 * Adds charges up in TWD. Charges that are all in TWD need no rates, so they add up even while rates load.
 *
 * @param occurrences - The charges.
 * @param rates - Rates ordered by date, or null when they are not loaded.
 * @returns The TWD total in whole cents, or null when foreign charges cannot be converted.
 */
export function reportTwdCents(occurrences: Occurrence[], rates: ExchangeRateDto[] | null): number | null {
  return needsExchangeRate(occurrences) ? convertedTwdCents(occurrences, rates) : (sumByCurrency(occurrences).TWD ?? 0);
}

/**
 * Computes a part's fraction of a whole.
 *
 * @param part - The part, or null when unknown.
 * @param whole - The whole, or null when unknown.
 * @returns A fraction from 0 to 1; 0 when either is unknown or the whole is not positive.
 */
export function shareOf(part: number | null, whole: number | null): number {
  return part === null || whole === null || whole <= 0 ? 0 : part / whole;
}

/**
 * Adds a year's charges up per month.
 *
 * @param occurrences - The year's charges.
 * @param rates - The year's rates, or null when they are not loaded.
 * @returns Twelve entries, January first; months without charges have empty totals and 0 TWD.
 */
export function monthlyTotals(occurrences: Occurrence[], rates: ExchangeRateDto[] | null): MonthTotal[] {
  const byMonth = Array.from({ length: MONTHS }, (): Occurrence[] => []);
  for (const occurrence of occurrences) {
    byMonth[Number(occurrence.date.slice(5, 7)) - 1].push(occurrence);
  }
  return byMonth.map((charges, index) => ({
    month: index + 1,
    totals: sumByCurrency(charges),
    twdCents: reportTwdCents(charges, rates),
  }));
}

/**
 * Picks the month whose TWD total wins a comparison; the earlier month wins a tie.
 *
 * @param months - Candidate months, all with a TWD total.
 * @param wins - Whether a total beats the current pick.
 */
function pickMonth(months: MonthTotal[], wins: (candidate: number, current: number) => boolean): MonthTotal | null {
  return months.reduce<MonthTotal | null>(
    (picked, month) => (picked === null || wins(month.twdCents ?? 0, picked.twdCents ?? 0) ? month : picked),
    null,
  );
}

/**
 * Derives the year's headline figures.
 *
 * @param months - The year's monthly totals, from {@link monthlyTotals}.
 * @param occurrences - The year's charges.
 */
export function yearHighlights(months: MonthTotal[], occurrences: Occurrence[]): YearHighlights {
  const converted = months.every((month) => month.twdCents !== null);
  const twdCents = converted ? months.reduce((total, month) => total + (month.twdCents ?? 0), 0) : null;
  const charged = converted ? months.filter((month) => Object.keys(month.totals).length > 0) : [];

  return {
    totals: sumByCurrency(occurrences),
    twdCents,
    monthlyAverageTwdCents: twdCents === null ? null : Math.round(twdCents / MONTHS / 100) * 100,
    chargeCount: occurrences.length,
    subscriptionCount: new Set(occurrences.map(({ subscription }) => subscription.id)).size,
    highest: pickMonth(charged, (candidate, current) => candidate > current),
    lowest: pickMonth(charged, (candidate, current) => candidate < current),
  };
}

/**
 * Adds TWD totals and shares to group subtotals.
 *
 * @param groups - Subtotals such as {@link totalsByCategory}'s.
 * @param rates - The year's rates, or null when they are not loaded.
 * @returns The groups in the same order.
 */
export function groupShares(groups: GroupTotal[], rates: ExchangeRateDto[] | null): GroupShare[] {
  const converted = groups.map(({ key, label, icon, totals, occurrences }) => ({
    key,
    label,
    icon,
    totals,
    twdCents: reportTwdCents(occurrences, rates),
  }));
  const whole = converted.every((group) => group.twdCents !== null)
    ? converted.reduce((total, group) => total + (group.twdCents ?? 0), 0)
    : null;
  return converted.map((group) => ({ ...group, share: shareOf(group.twdCents, whole) }));
}

/** Key of the group that {@link foldGroupShares} merges the smallest groups into. */
export const OTHER_GROUP_KEY = -1;

/**
 * Keeps a chart within its hues by merging the smallest groups into one "其他" group, appended last.
 *
 * @param groups - The groups, in display order.
 * @param slots - The most groups the chart can show.
 * @returns The groups unchanged when they fit; otherwise the largest `slots - 1` in their original order, plus
 *   "其他".
 */
export function foldGroupShares(groups: GroupShare[], slots: number): GroupShare[] {
  if (groups.length <= slots) return groups;

  const kept = new Set(
    [...groups]
      .sort((a, b) => (b.twdCents ?? 0) - (a.twdCents ?? 0))
      .slice(0, slots - 1)
      .map((group) => group.key),
  );
  const rest = groups.filter((group) => !kept.has(group.key));
  const other: GroupShare = {
    key: OTHER_GROUP_KEY,
    label: "其他",
    icon: null,
    totals: totalByCurrency(rest.flatMap((group) => currencyEntries(group.totals))),
    twdCents: rest.every((group) => group.twdCents !== null)
      ? rest.reduce((total, group) => total + (group.twdCents ?? 0), 0)
      : null,
    share: rest.reduce((total, group) => total + group.share, 0),
  };
  return [...groups.filter((group) => kept.has(group.key)), other];
}

/**
 * Ranks subscriptions by what they charge over the year.
 *
 * @param occurrences - The year's charges.
 * @param rates - The year's rates, or null when they are not loaded.
 * @returns One entry per subscription, most expensive first, then by name; entries that cannot be converted
 *   yet come last.
 */
export function subscriptionRanking(occurrences: Occurrence[], rates: ExchangeRateDto[] | null): RankedSubscription[] {
  const ranked = chargesBySubscription(occurrences)
    .map(({ subscription, count, totalCents, occurrences: charges }) => ({
      subscription,
      count,
      totals: totalByCurrency([[subscription.currency, totalCents]]),
      twdCents: reportTwdCents(charges, rates),
    }))
    .sort((a, b) => (b.twdCents ?? -1) - (a.twdCents ?? -1) || a.subscription.name.localeCompare(b.subscription.name));
  const top = ranked[0]?.twdCents ?? null;
  return ranked.map((entry) => ({ ...entry, share: shareOf(entry.twdCents, top) }));
}
