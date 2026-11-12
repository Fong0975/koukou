import { Fragment } from "react";

/**
 * Joins segments with " · ", keeping each segment on one line so the text only wraps between them.
 *
 * @param props.segments - The segments, in order.
 */
function Segments({ segments }: { segments: string[] }) {
  return segments.map((segment, index) => (
    <Fragment key={index}>
      {index > 0 && " · "}
      <span className="whitespace-nowrap">{segment}</span>
    </Fragment>
  ));
}

interface ResponsiveSegmentsProps {
  /** Shown from the `sm` breakpoint up. */
  full: string[];
  /** Shown on narrow screens instead, so the line is less likely to wrap. */
  compact: string[];
}

/**
 * A line of " · "-separated segments, worded in full on wide screens and compactly on narrow ones.
 *
 * @param props.full - The wide-screen segments.
 * @param props.compact - The narrow-screen segments.
 */
export function ResponsiveSegments({ full, compact }: ResponsiveSegmentsProps) {
  return (
    <>
      <span className="sm:hidden">
        <Segments segments={compact} />
      </span>
      <span className="hidden sm:inline">
        <Segments segments={full} />
      </span>
    </>
  );
}
