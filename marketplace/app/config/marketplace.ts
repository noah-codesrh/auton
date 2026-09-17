export function hedgeSavingsPercent(contract: {
  spotRatePerM: number | null;
  lockedRatePerM: number;
}) {
  if (!contract.spotRatePerM || contract.spotRatePerM <= 0) {
    return 0;
  }

  const savings =
    ((contract.spotRatePerM - contract.lockedRatePerM) /
      contract.spotRatePerM) *
    100;
  return Math.max(0, Math.round(savings));
}

/** Real USD saved per million tokens (live spot − locked). Null if no live spot. */
export function hedgeSavingsPerM(contract: {
  spotRatePerM: number | null;
  lockedRatePerM: number;
}) {
  if (contract.spotRatePerM === null || !Number.isFinite(contract.spotRatePerM)) {
    return null;
  }
  return Math.max(0, contract.spotRatePerM - contract.lockedRatePerM);
}

/** Short relative time like "just now", "12s ago", "3m ago". */
export function formatRelativeTime(iso: string | null) {
  if (!iso) return null;

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function formatRatePerM(rate: number | null | undefined) {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return "—";
  }
  return `$${rate.toFixed(2)}/M`;
}

export function formatTokenMillions(tokens: number) {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return String(tokens);
}

/** Short label for contract cards (normal users). */
export function contractLabel(tier: string, fallbackName: string) {
  if (tier.includes("SEEK")) return "DeepSeek";
  if (tier.includes("LLAMA")) return "Llama";
  if (tier.includes("QWEN")) return "Qwen";
  if (tier.includes("MISTRAL")) return "Mistral";
  if (tier.includes("GPT")) return "GPT";
  if (tier.includes("GEMINI")) return "Gemini";
  if (tier.includes("CLAUDE")) return "Claude";
  if (tier.includes("FRONTIER")) return "Frontier";
  return fallbackName.replace(/ Inference Future$/i, "");
}

export function contractModelFamily(tier: string) {
  if (tier.includes("SEEK")) return "DeepSeek models";
  if (tier.includes("LLAMA")) return "Llama models";
  if (tier.includes("QWEN")) return "Qwen models";
  if (tier.includes("MISTRAL")) return "Mistral models";
  if (tier.includes("GPT")) return "OpenAI GPT models";
  if (tier.includes("GEMINI")) return "Google Gemini models";
  if (tier.includes("CLAUDE")) return "Anthropic Claude models";
  if (tier.includes("FRONTIER")) return "GPT · Claude · Gemini";
  return "AI models";
}

export function formatExpiryShort(expiry: string) {
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime())) return expiry;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
