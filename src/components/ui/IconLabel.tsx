/**
 * A label with an optional decorative emoji in front, e.g. a category name with its icon.
 *
 * @param props.icon - Emoji shown before the label, hidden from screen readers; omitted when null.
 * @param props.label - The text.
 */
export function IconLabel({ icon, label }: { icon: string | null; label: string }) {
  return (
    <>
      {icon && <span aria-hidden="true">{icon} </span>}
      {label}
    </>
  );
}
