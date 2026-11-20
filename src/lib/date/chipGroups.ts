import { RESERVE_LABEL, type Chip } from "./calendarDay";

/** Popup heading of each chip kind. */
const GROUP_HEADINGS: Record<Chip["variant"], string> = {
  expiry: "到期",
  charge: "扣款項目",
  reserve: RESERVE_LABEL,
};

/** Chip kinds from most to least severe, the order the calendar lists them in. */
const GROUP_ORDER: Chip["variant"][] = ["expiry", "charge", "reserve"];

/** Chips of one kind under their popup heading. */
export interface ChipGroup {
  variant: Chip["variant"];
  heading: string;
  chips: Chip[];
}

/**
 * Splits chips into one group per kind, from most to least severe, leaving out kinds without chips.
 *
 * @param chips - The chips to group, e.g. the ones a day cell collapsed into "+N".
 */
export function groupChips(chips: Chip[]): ChipGroup[] {
  return GROUP_ORDER.flatMap((variant) => {
    const members = chips.filter((chip) => chip.variant === variant);
    return members.length > 0 ? [{ variant, heading: GROUP_HEADINGS[variant], chips: members }] : [];
  });
}
