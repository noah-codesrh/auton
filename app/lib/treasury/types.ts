export type TreasuryTimePoint = {
  date: string;
  label: string;
  value: number;
};

export type TreasuryStats = {
  totalLocked: number;
  lockedSupplyPercent: number;
  buybackCount: number;
  buybacksUsdcCompleted: number;
  totalStaked: number;
  stakedSupplyPercent: number;
  buybackSpendUsdc: number;
  stakerRewardsUsdc: number;
  settlementFeesUsdc: number;
};

export type TreasuryData = {
  stats: TreasuryStats;
  lockedHistory: TreasuryTimePoint[];
  stakedHistory: TreasuryTimePoint[];
};
