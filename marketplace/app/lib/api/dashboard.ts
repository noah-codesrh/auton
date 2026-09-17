import { request } from "./client";

export type DashboardStats = {
  apiKeys: {
    id: string;
    name: string;
    key_prefix: string;
    active: boolean;
    created_at: string;
  }[];
  computeBalances: {
    id: string;
    modelTier: string;
    tokenBalanceRemaining: string;
    expiryDate: string;
    isExpired: boolean;
  }[];
  staking: {
    totalStakedAuto: string;
    claimableUsdcYield: string;
    stakeCount: number;
  };
};

export async function fetchDashboardStats() {
  return request<DashboardStats>("/api/v1/dashboard/");
}

export async function createApiKey(name: string) {
  return request<{
    apiKey: DashboardStats["apiKeys"][number];
    key: string;
    warning: string;
  }>("/api/v1/dashboard/api-keys", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
