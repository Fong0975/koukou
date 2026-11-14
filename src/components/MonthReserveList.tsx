import { useMemo } from "react";
import { sumReserves, type Reserve } from "@/lib/amortization";
import { convertedReserveTwdCents } from "@/lib/currencyConversion";
import type { ExchangeRateDto } from "@/types/dto";
import { CardFooter } from "./CardFooter";
import { CollapsibleCard } from "./CollapsibleCard";
import { ConvertedAmounts } from "./ConvertedAmounts";
import { MonthReserveItem } from "./MonthReserveItem";

interface MonthReserveListProps {
  /** The month's reserves, already in display order. */
  reserves: Reserve[];
  /** USD→TWD rates for showing foreign reserves in TWD, or null to keep them per currency. */
  rates: ExchangeRateDto[] | null;
}

/**
 * Collapsible card listing what to set aside this month for upcoming amortized yearly charges, one row per
 * charge, with a footer holding the rounded-up subtotal: in TWD with the per-currency amounts behind an info
 * icon when exchange rates are available, otherwise per currency. Renders nothing without reserves.
 *
 * @param props.reserves - The month's reserves.
 * @param props.rates - The year's exchange rates.
 */
export function MonthReserveList({ reserves, rates }: MonthReserveListProps) {
  const totals = useMemo(() => sumReserves(reserves), [reserves]);
  const twdCents = useMemo(() => convertedReserveTwdCents(reserves, rates), [reserves, rates]);
  if (reserves.length === 0) return null;

  return (
    <CollapsibleCard
      title="本月預扣"
      header={<p className="mt-1 text-sm text-ink-soft">年繳項目均攤到扣款前 12 個月，本月應先預留的金額</p>}
      footer={
        <CardFooter label="預留小計">
          <ConvertedAmounts totals={totals} twdCents={twdCents} layout="popup" className="items-end font-semibold" />
        </CardFooter>
      }
    >
      <ul aria-label="本月預扣" className="divided-list">
        {reserves.map((reserve) => (
          <MonthReserveItem key={reserve.key} reserve={reserve} rates={rates} />
        ))}
      </ul>
    </CollapsibleCard>
  );
}
