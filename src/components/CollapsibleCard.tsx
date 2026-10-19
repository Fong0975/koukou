"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./Icons";

interface CollapsibleCardProps {
  title: string;
  /** More header content under the title, e.g. a description or a headline total; kept visible while collapsed. */
  header?: ReactNode;
  /**
   * A line under the header that becomes the toggle instead of the title, e.g. a count of what the body breaks
   * down. Shown as plain text when the card is not collapsible.
   */
  toggle?: ReactNode;
  /** Shown below the body whether or not it is collapsed. */
  footer?: ReactNode;
  /** False shows the body without a toggle, e.g. for an empty-state message. */
  collapsible?: boolean;
  /** The body, hidden while collapsed; without one the card has no body. */
  children?: ReactNode;
}

/**
 * Glass card whose body folds away, leaving only the header and footer. It starts collapsed. The title is the
 * toggle unless a separate `toggle` line is given.
 *
 * @param props.title - The card's heading.
 * @param props.header - More header content under the title.
 * @param props.toggle - Line that toggles the body in place of the title.
 * @param props.footer - Footer kept visible while collapsed.
 * @param props.collapsible - Whether the body can be collapsed.
 * @param props.children - The body.
 */
export function CollapsibleCard({ title, header, toggle, footer, collapsible = true, children }: CollapsibleCardProps) {
  const titleId = useId();
  const bodyId = useId();
  const [expanded, setExpanded] = useState(false);

  const toggleButton = (label: ReactNode) => (
    <button
      type="button"
      className="flex items-center gap-2 text-left"
      aria-expanded={expanded}
      aria-controls={bodyId}
      onClick={() => setExpanded((open) => !open)}
    >
      {label}
      <ChevronDownIcon className={`text-ink-soft transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <section aria-labelledby={titleId} className="glass flex flex-col gap-3 rounded-[1.75rem] p-5 sm:p-6">
      <div>
        <h2 id={titleId} className="text-xl">
          {collapsible && !toggle ? toggleButton(title) : title}
        </h2>
        {header}
        {toggle && <div className="mt-1">{collapsible ? toggleButton(toggle) : toggle}</div>}
      </div>
      {children && (
        <div id={bodyId} hidden={collapsible && !expanded}>
          {children}
        </div>
      )}
      {footer}
    </section>
  );
}
