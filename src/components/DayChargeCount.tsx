import type { Occurrence } from "@/lib/billingOccurrences";
import type { ContractExpiry } from "@/lib/contractExpiries";
import type { SubscriptionDto } from "@/types/dto";
import { HoverTapPopup, type PopupAlign } from "./HoverTapPopup";
import { IconLabel } from "./IconLabel";

interface DayChargeCountProps {
  day: number;
  occurrences: Occurrence[];
  expiries: ContractExpiry[];
  align: PopupAlign;
}

/**
 * Builds the trigger's accessible name, e.g. "15 日扣款項目（2 筆）、合約到期（1 筆）".
 */
function triggerLabel(day: number, chargeCount: number, expiryCount: number): string {
  const parts = [
    ...(chargeCount > 0 ? [`扣款項目（${chargeCount} 筆）`] : []),
    ...(expiryCount > 0 ? [`合約到期（${expiryCount} 筆）`] : []),
  ];
  return `${day} 日${parts.join("、")}`;
}

/**
 * Popup list of subscription names, each with its category icon.
 *
 * @param props.label - The list's accessible name.
 * @param props.items - The entries, keyed for React.
 */
function NameList({ label, items }: { label: string; items: { key: string; subscription: SubscriptionDto }[] }) {
  return (
    <ul aria-label={label} className="flex flex-col gap-1">
      {items.map(({ key, subscription }) => (
        <li key={key} className="break-words">
          <IconLabel icon={subscription.category.icon} label={subscription.name} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Narrow-screen marker of a day's charges and contract expiries: a gold dot with the charge count and a red
 * dot with the expiry count that, on mouse hover or a tap, pop up their names.
 *
 * @param props.day - Day of the month, used in the accessible names.
 * @param props.occurrences - Charges falling on this day.
 * @param props.expiries - Contracts ending on this day; this and `occurrences` must not both be empty.
 * @param props.align - Edge the popup lines up with.
 */
export function DayChargeCount({ day, occurrences, expiries, align }: DayChargeCountProps) {
  return (
    <HoverTapPopup
      label={triggerLabel(day, occurrences.length, expiries.length)}
      align={align}
      className="mt-1 sm:hidden"
      triggerClassName="flex w-full flex-wrap items-center justify-center gap-x-1.5 rounded-md px-1 py-0.5 font-num text-xs"
      trigger={
        <>
          {occurrences.length > 0 && (
            <span className="flex items-center gap-1 text-coin-600">
              <span className="size-1.5 rounded-full bg-coin-400" />
              {occurrences.length}
            </span>
          )}
          {expiries.length > 0 && (
            <span className="flex items-center gap-1 text-berry">
              <span className="size-1.5 rounded-full bg-berry" />
              {expiries.length}
            </span>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {occurrences.length > 0 && (
          <NameList
            label={`${day} 日扣款項目`}
            items={occurrences.map(({ subscription, scheduleId }) => ({
              key: `${subscription.id}-${scheduleId}`,
              subscription,
            }))}
          />
        )}
        {expiries.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-berry">合約到期</p>
            <NameList
              label={`${day} 日合約到期`}
              items={expiries.map(({ subscription }) => ({ key: String(subscription.id), subscription }))}
            />
          </div>
        )}
      </div>
    </HoverTapPopup>
  );
}
