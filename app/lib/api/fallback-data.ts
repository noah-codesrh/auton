import { autoTreasuryConfig } from "../../config/auto-treasury";
import type { DashboardStats } from "./types";
import type { TreasuryData, TreasuryTimePoint } from "../treasury/types";

const now = Date.now();

function daysAgo(days: number) {
  const date = new Date(now - days * 86_400_000);
  return {
    date: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
  };
}

function buildLockedHistory(): TreasuryTimePoint[] {
  const locked = autoTreasuryConfig.lockedAutoTokens;
  const points = [
    { days: 6, value: 0 },
    { days: 4, value: 8_000_000 },
    { days: 2, value: 22_000_000 },
    { days: 0, value: locked },
  ];

  return points.map(({ days, value }) => {
    const { date, label } = daysAgo(days);
    return { date, label, value };
  });
}

function buildStakedHistory(): TreasuryTimePoint[] {
  const points = [
    { days: 9, value: 58_000_000 },
    { days: 8, value: 61_500_000 },
    { days: 7, value: 64_200_000 },
    { days: 6, value: 62_800_000 },
    { days: 5, value: 66_100_000 },
    { days: 4, value: 68_400_000 },
    { days: 3, value: 70_200_000 },
    { days: 2, value: 71_800_000 },
    { days: 1, value: 72_100_000 },
    { days: 0, value: 72_540_000 },
  ];

  return points.map(({ days, value }) => {
    const { date, label } = daysAgo(days);
    return { date, label, value };
  });
}

export const FALLBACK_DASHBOARD: DashboardStats = {
  apiKeys: [
    {
      id: "key_prod_agent",
      name: "production-agent",
      key_prefix: "auton_sk_7f2a",
      active: true,
      created_at: "2026-05-12T14:22:00.000Z",
    },
    {
      id: "key_research",
      name: "research-bot",
      key_prefix: "auton_sk_9c1e",
      active: true,
      created_at: "2026-04-02T09:15:00.000Z",
    },
  ],
  computeBalances: [
    {
      id: "bal_deepseek",
      modelTier: "DEEPSEEK_JULY26",
      tokenBalanceRemaining: "2500000",
      expiryDate: "2026-07-31T00:00:00.000Z",
      isExpired: false,
    },
    {
      id: "bal_llama",
      modelTier: "LLAMA_AUG26",
      tokenBalanceRemaining: "850000",
      expiryDate: "2026-08-31T00:00:00.000Z",
      isExpired: false,
    },
  ],
  staking: {
    totalStakedAuto: "1250000",
    claimableUsdcYield: "47.82",
    stakeCount: 2,
  },
};

export const FALLBACK_TREASURY: TreasuryData = {
  stats: {
    totalLocked: autoTreasuryConfig.lockedAutoTokens,
    lockedSupplyPercent: 3.4,
    buybackCount: 1,
    buybacksUsdcCompleted: autoTreasuryConfig.buybacksUsdcCompleted,
    totalStaked: 0,
    stakedSupplyPercent: 0,
    buybackSpendUsdc: autoTreasuryConfig.buybacksUsdcCompleted,
    stakerRewardsUsdc: 0,
    settlementFeesUsdc: autoTreasuryConfig.buybacksUsdcCompleted,
  },
  lockedHistory: buildLockedHistory(),
  stakedHistory: buildStakedHistory(),
};

export const FALLBACK_STAKING = {
  staked: 1_250_000,
  earning: 980_000,
  coolingDown: 270_000,
  claimableUsdc: 47.82,
  vaultAddress: "32YQpK9mNn4vR8xL6wH3fT7bC2dE5gJ1kM9pQ4sU6vW8x",
};
