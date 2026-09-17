export function formatCompactNumber(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}b`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}k`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatTokenCount(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}
