import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CollapsibleCard } from "./CollapsibleCard";

describe("CollapsibleCard", () => {
  const tests: {
    name: string;
    collapsible?: boolean;
    withoutBody?: boolean;
    /** A separate toggle line in place of the title. */
    toggle?: string;
    /** How many times to click the toggle before checking. */
    clicks: number;
    /** The toggle's aria-expanded, or null without a toggle. */
    expectedExpanded: boolean | null;
    expectedBodyVisible: boolean;
  }[] = [
    {
      name: "starts collapsed, keeping the header and footer",
      clicks: 0,
      expectedExpanded: false,
      expectedBodyVisible: false,
    },
    { name: "clicking the title expands the body", clicks: 1, expectedExpanded: true, expectedBodyVisible: true },
    { name: "clicking it again collapses the body", clicks: 2, expectedExpanded: false, expectedBodyVisible: false },
    {
      name: "a non-collapsible card shows its body without a toggle",
      collapsible: false,
      clicks: 0,
      expectedExpanded: null,
      expectedBodyVisible: true,
    },
    {
      name: "a separate toggle line expands the body, leaving the title plain",
      toggle: "共 3 項",
      clicks: 1,
      expectedExpanded: true,
      expectedBodyVisible: true,
    },
    {
      name: "a separate toggle line stays plain text when not collapsible",
      collapsible: false,
      toggle: "共 3 項",
      clicks: 0,
      expectedExpanded: null,
      expectedBodyVisible: true,
    },
    {
      name: "a card without a body keeps only its header and footer",
      collapsible: false,
      withoutBody: true,
      clicks: 0,
      expectedExpanded: null,
      expectedBodyVisible: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <CollapsibleCard
          title="本月到期"
          header={<p>說明</p>}
          toggle={tt.toggle}
          footer={<footer>小計</footer>}
          collapsible={tt.collapsible}
        >
          {!tt.withoutBody && (
            <ul aria-label="內容">
              <li>項目</li>
            </ul>
          )}
        </CollapsibleCard>,
      );
      const toggleName = tt.toggle ?? "本月到期";
      for (let i = 0; i < tt.clicks; i++) fireEvent.click(screen.getByRole("button", { name: toggleName }));

      // Header, body (when given) and footer.
      expect(screen.getByRole("region", { name: "本月到期" }).children).toHaveLength(tt.withoutBody ? 2 : 3);
      expect(screen.getByRole("heading", { level: 2, name: "本月到期" })).toBeInTheDocument();
      expect(screen.getByText("說明")).toBeVisible();
      expect(screen.getByText("小計")).toBeVisible();
      if (tt.toggle) {
        expect(screen.getByText(tt.toggle)).toBeVisible();
        expect(screen.queryByRole("button", { name: "本月到期" })).not.toBeInTheDocument();
      }

      const expanded = screen.queryByRole("button", { name: toggleName })?.getAttribute("aria-expanded") ?? null;
      expect(expanded).toBe(tt.expectedExpanded === null ? null : `${tt.expectedExpanded}`);
      expect(screen.queryByRole("list", { name: "內容" }) !== null).toBe(tt.expectedBodyVisible);
    });
  }
});
