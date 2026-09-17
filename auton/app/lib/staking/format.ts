import BN from "bn.js";

export function formatTokenAmount(
  amount: BN | bigint | number,
  decimals: number,
  maxFractionDigits = 4,
): string {
  const value =
    amount instanceof BN ? amount.toString() : amount.toString();

  if (decimals === 0) return value;

  const padded = value.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");

  if (!fraction) return whole;

  const trimmed = fraction.slice(0, maxFractionDigits);
  return `${whole}.${trimmed}`;
}

export function parseTokenAmount(input: string, decimals: number): BN {
  const trimmed = input.trim();
  if (!trimmed || Number.isNaN(Number(trimmed))) {
    return new BN(0);
  }

  const [whole = "0", fraction = ""] = trimmed.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const raw = `${whole}${paddedFraction}`.replace(/^0+/, "") || "0";

  return new BN(raw);
}
