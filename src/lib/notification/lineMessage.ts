/** One component of a LINE Flex Message, e.g. a box, text or image. */
export interface FlexNode {
  type: string;
  [property: string]: unknown;
}

/** A plain text message. */
export interface TextMessage {
  type: "text";
  /** At most 5000 characters. */
  text: string;
}

/** A card laid out with Flex Message components. */
export interface FlexMessage {
  type: "flex";
  /** Shown in the notification and chat list in place of the card; at most 400 characters. */
  altText: string;
  contents: FlexNode;
}

/** A message the LINE push API accepts. */
export type LineMessage = TextMessage | FlexMessage;

/**
 * Wraps text as a message.
 *
 * @param text - The text, or null when there is nothing to send.
 * @returns The message, or null when `text` is null.
 */
export function toTextMessage(text: string | null): TextMessage | null {
  return text === null ? null : { type: "text", text };
}
