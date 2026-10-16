import type { Currency } from "@/generated/prisma/enums";

/**
 * A small four-hole button coin, the KouKou motif. Gold for TWD, green for USD,
 * so the currency is recognizable at a glance.
 *
 * @param props.currency - Currency the coin represents.
 */
export function CoinMark({ currency }: { currency: Currency }) {
  const face =
    currency === "USD" ? "from-leaf-300 to-leaf-500 ring-leaf-600/40" : "from-coin-300 to-coin-400 ring-coin-600/40";
  return (
    <span
      aria-hidden="true"
      className={`inline-grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-br ring-2 ${face}`}
    >
      <span className="grid grid-cols-2 gap-[3px]">
        {[0, 1, 2, 3].map((hole) => (
          <span key={hole} className="size-[4px] rounded-full bg-ink/45" />
        ))}
      </span>
    </span>
  );
}
