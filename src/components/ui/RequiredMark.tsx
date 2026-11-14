/** Tooltip shown when hovering the mark. */
export const REQUIRED_HINT = "必填";

/**
 * Red asterisk placed after a required field's label, showing {@link REQUIRED_HINT} on hover. It is hidden
 * from assistive technology and adds no text to the label, so the field keeps its name; mark the field
 * itself with `aria-required` instead.
 */
export function RequiredMark() {
  return <span className="required-mark" aria-hidden="true" data-tooltip={REQUIRED_HINT} />;
}
