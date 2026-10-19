import { within } from "@testing-library/react";

/**
 * Reads the amount lines shown next to a card footer's label.
 *
 * @param container - The rendered card's container.
 * @param label - The footer's label, e.g. "預留小計".
 * @returns One string per amount line, or null when the card has no footer.
 */
export function footerAmounts(container: HTMLElement, label: string): string[] | null {
  const footer = container.querySelector<HTMLElement>("footer");
  if (footer === null) return null;
  const amounts = within(footer).getByText(label).nextElementSibling;
  return [...(amounts?.children ?? [])].map((line) => line.textContent ?? "");
}
