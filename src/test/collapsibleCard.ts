import { fireEvent, screen } from "@testing-library/react";

/**
 * Expands a collapsed card by clicking its toggle.
 *
 * @param toggle - The toggle's text: the card's title, e.g. "本月預扣", or its separate toggle line.
 */
export function expandCard(toggle: string): void {
  fireEvent.click(screen.getByRole("button", { name: toggle, expanded: false }));
}
