import type { TreasuryData } from "./types";

export const EMPTY_TREASURY_DATA: TreasuryData = {
  stats: {
    totalLocked: 0,
    lockedSupplyPercent: 0,
    buybackCount: 0,
    buybacksUsdcCompleted: 0,
    totalStaked: 0,
    stakedSupplyPercent: 0,
    buybackSpendUsdc: 0,
    stakerRewardsUsdc: 0,
    settlementFeesUsdc: 0,
  },
  lockedHistory: [],
  stakedHistory: [],
};
