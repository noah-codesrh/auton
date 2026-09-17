import { request } from "./client";

export type CreditAsset = "USDC" | "AUTO";

export type CreditBalance = {
  balanceUsdMicro: string;
  balanceUsd: number;
  totalPurchasedUsdMicro: string;
  totalSpentUsdMicro: string;
  updatedAt: string | null;
};

export type TopUpQuote = {
  asset: CreditAsset;
  usdAmount: number;
  usdMicro: string;
  tokenAmount: number;
  amountBase: string;
  decimals: number;
  mint: string;
  treasuryWallet: string;
  autoPrice: number | null;
  paymentRequired: boolean;
  minTopUpUsd: number;
};

export type TopUpResult = {
  balance: CreditBalance;
  creditedUsd: number;
  txSignature?: string;
};

export type CreditUsageEntry = {
  id: string;
  model: string;
  promptTokens: string;
  completionTokens: string;
  totalTokens: string;
  usdChargedMicro: string;
  createdAt: string;
};

export async function fetchCreditBalance() {
  return request<CreditBalance>("/api/v1/chat/balance");
}

export async function fetchTopUpQuote(usdAmount: number, asset: CreditAsset) {
  const params = new URLSearchParams({
    usdAmount: String(usdAmount),
    asset,
  });
  return request<TopUpQuote>(`/api/v1/chat/quote?${params.toString()}`);
}

export async function topUpCredits(input: {
  amount: number;
  asset: CreditAsset;
  txSignature?: string;
}) {
  return request<TopUpResult>("/api/v1/chat/topup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchCreditUsage() {
  return request<{ usage: CreditUsageEntry[] }>("/api/v1/chat/usage");
}

export function usdFromMicro(micro: string | bigint): number {
  const value = typeof micro === "string" ? BigInt(micro) : micro;
  return Number(value) / 1_000_000;
}
