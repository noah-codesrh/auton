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
