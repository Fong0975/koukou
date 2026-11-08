import { formatReminders } from "@/lib/reminderText";
import type { RemindersDto } from "@/types/dto";
import { BellIcon } from "./Icons";

/**
 * Small bell marking a subscription with LINE reminders; hovering it, or a screen reader, tells which ones.
 * Renders nothing without any reminder.
 *
 * @param props.reminders - The subscription's reminder days.
 */
export function ReminderBadge({ reminders }: { reminders: RemindersDto }) {
  const summary = formatReminders(reminders);
  if (summary === null) return null;

  return (
    <span role="img" aria-label={summary} title={summary} className="inline-flex shrink-0 text-leaf-600">
      <BellIcon width={16} height={16} />
    </span>
  );
}
