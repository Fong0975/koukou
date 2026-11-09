import type { FlexNode } from "@/lib/notification/lineMessage";

/** Every text in a component, in reading order. */
export function textsOf(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(textsOf);
  if (typeof node !== "object" || node === null) return [];
  const { type, text, contents } = node as FlexNode;
  if (type === "text") {
    // A text made of spans reads as the spans put together.
    return [typeof text === "string" ? text : textsOfSpans(contents)];
  }
  return textsOf(contents);
}

function textsOfSpans(spans: unknown): string {
  return Array.isArray(spans) ? spans.map((span: FlexNode) => String(span.text)).join("") : "";
}

/** The section cards in a bubble's body. */
export function sectionsOf(bubble: FlexNode): FlexNode[] {
  return (bubble.body as { contents: FlexNode[] }).contents;
}

/** The title row of a section card: icon, title and, when there is one, a pill. */
export const titleRowOf = (section: FlexNode) => (section.contents as FlexNode[])[0].contents as FlexNode[];
