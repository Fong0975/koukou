import type { Currency } from "@/generated/prisma/enums";
import { formatApproxTwd } from "@/lib/format/money";
import type { ExchangeRateDto } from "@/types/dto";

interface ApproxTwdLineProps {
  currency: Currency;
  /** USD→TWD rates, or null while they are unavailable. */
  rates: ExchangeRateDto[] | null;
  /** Converts the amount to TWD cents with the rates. */
  toTwdCents: (rates: ExchangeRateDto[]) => number;
}

/**
 * The approximate TWD of a foreign amount, e.g. "≈ NT$ 1,003", on a small line under it. Shows nothing for a
 * TWD amount or while the rates are unavailable.
 */
export function ApproxTwdLine({ currency, rates, toTwdCents }: ApproxTwdLineProps) {
  if (!rates || currency === "TWD") return null;
  return <p className="text-xs text-ink-soft">{formatApproxTwd(toTwdCents(rates))}</p>;
}
