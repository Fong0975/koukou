import type { Chip } from "@/lib/date/calendarDay";
import { groupChips } from "@/lib/date/chipGroups";
import { HoverTapPopup, type PopupAlign } from "../ui/HoverTapPopup";

interface HiddenChipsPopupProps {
  /** The chips the day cell has no room to list. */
  chips: Chip[];
  /** Edge the popup lines up with. */
  align: PopupAlign;
}

/** Heading colour of each chip kind, matching its chip. */
const HEADING_CLASSES: Record<Chip["variant"], string> = {
  expiry: "text-berry",
  charge: "text-coin-600",
  reserve: "text-tide-600",
};

/**
 * Wide-screen "+N" chip standing for the chips a day cell collapsed; on mouse hover or a tap it pops up their
 * names under a heading per kind, like the narrow-screen summary but only for the hidden ones.
 *
 * @param props.chips - The hidden chips; must not be empty.
 * @param props.align - Edge the popup lines up with.
 */
export function HiddenChipsPopup({ chips, align }: HiddenChipsPopupProps) {
  return (
    <HoverTapPopup
      label={`其餘 ${chips.length} 個項目`}
      align={align}
      triggerClassName="cal-chip cal-chip-more w-full"
      trigger={`+${chips.length}`}
    >
      <div className="flex flex-col gap-3">
        {groupChips(chips).map(({ variant, heading, chips: members }) => (
          <div key={variant} className="flex flex-col gap-1">
            <p className={`font-semibold ${HEADING_CLASSES[variant]}`}>{heading}</p>
            <ul aria-label={heading} className="flex flex-col gap-1 pl-3">
              {members.map(({ key, icon, name, amount }) => (
                <li key={key} className="flex items-baseline justify-between gap-5">
                  <span className="flex min-w-0 gap-1">
                    {icon && <span aria-hidden="true">{icon} </span>}
                    <span className="min-w-0 break-words">{name}</span>
                  </span>
                  {amount && <span className="shrink-0 font-num tabular-nums">{amount}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </HoverTapPopup>
  );
}
