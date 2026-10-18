import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoverTapPopup, type PopupAlign } from "./HoverTapPopup";

const trigger = () => screen.getByRole("button", { name: "詳細" });

describe("HoverTapPopup", () => {
  const tests: { name: string; align: PopupAlign; click: boolean; expectedClasses: string[] | null }[] = [
    { name: "keeps the popup closed until opened", align: "start", click: false, expectedClasses: null },
    { name: "lines the popup up with the start edge", align: "start", click: true, expectedClasses: ["left-0"] },
    {
      name: "centres the popup under the trigger",
      align: "center",
      click: true,
      expectedClasses: ["left-1/2", "-translate-x-1/2"],
    },
    { name: "lines the popup up with the end edge", align: "end", click: true, expectedClasses: ["right-0"] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <HoverTapPopup label="詳細" align={tt.align} trigger={<span>NT$ 1,500</span>}>
          <p>popup</p>
        </HoverTapPopup>,
      );

      if (tt.click) fireEvent.click(trigger());

      expect(trigger()).toHaveTextContent("NT$ 1,500");
      expect(trigger()).toHaveAttribute("aria-expanded", String(tt.click));
      if (tt.expectedClasses === null) {
        expect(screen.queryByText("popup")).not.toBeInTheDocument();
        expect(trigger()).not.toHaveAttribute("aria-controls");
        return;
      }
      const popup = screen.getByText("popup").parentElement;
      expect(popup).toHaveAttribute("id", trigger().getAttribute("aria-controls"));
      expect(popup).toHaveClass("popup", ...tt.expectedClasses);
    });
  }
});
