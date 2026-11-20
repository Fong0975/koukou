// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Chip } from "./calendarDay";
import { groupChips } from "./chipGroups";

const chip = (key: string, variant: Chip["variant"]): Chip => ({
  key,
  variant,
  icon: null,
  label: key,
  name: key,
  title: key,
  amount: null,
});

describe("groupChips", () => {
  const tests = [
    { name: "nothing without chips", chips: [], expected: [] },
    {
      name: "keeps the order within a kind and skips kinds without chips",
      chips: [chip("a", "charge"), chip("b", "charge")],
      expected: [{ variant: "charge", heading: "扣款項目", keys: ["a", "b"] }],
    },
    {
      name: "orders the kinds from most to least severe",
      chips: [chip("r", "reserve"), chip("c", "charge"), chip("e", "expiry")],
      expected: [
        { variant: "expiry", heading: "到期", keys: ["e"] },
        { variant: "charge", heading: "扣款項目", keys: ["c"] },
        { variant: "reserve", heading: "預扣", keys: ["r"] },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const groups = groupChips(tt.chips).map(({ variant, heading, chips }) => ({
        variant,
        heading,
        keys: chips.map((c) => c.key),
      }));
      expect(groups).toEqual(tt.expected);
    });
  }
});
