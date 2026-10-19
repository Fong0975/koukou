import type { ReactNode } from "react";

interface CardFooterProps {
  label: string;
  /** The amounts shown opposite the label. */
  children: ReactNode;
}

/**
 * Footer row of a card, separated by a rule, with a label on the left and its amounts on the right.
 *
 * @param props.label - What the amounts add up.
 * @param props.children - The amounts.
 */
export function CardFooter({ label, children }: CardFooterProps) {
  return (
    <footer className="flex items-start justify-between gap-3 border-t border-leaf-500/15 pt-4">
      <span className="shrink-0 text-sm text-ink-soft">{label}</span>
      {children}
    </footer>
  );
}
