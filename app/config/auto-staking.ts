/**
 * $AUTO staking config — set these in `.env` when the token launches:
 *
 *   VITE_AUTO_TOKEN_MINT=<SPL mint address>
 *   VITE_AUTO_STAKE_POOL=<Streamflow stake pool address>
 *   VITE_AUTO_REWARD_MINT=<USDC mint, optional>
 *   VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
 */

export type SolanaCluster = "mainnet-beta" | "devnet";

export const autoStakingConfig = {
  tokenMint: import.meta.env.VITE_AUTO_TOKEN_MINT?.trim() ?? "",
  stakePool: import.meta.env.VITE_AUTO_STAKE_POOL?.trim() ?? "",
  rewardMint: import.meta.env.VITE_AUTO_REWARD_MINT?.trim() ?? "",
  rpcUrl:
    import.meta.env.VITE_SOLANA_RPC_URL?.trim() ||
    "https://api.mainnet-beta.solana.com",
  cluster: (import.meta.env.VITE_SOLANA_CLUSTER?.trim() ||
    "mainnet-beta") as SolanaCluster,
  tokenDecimals: Number(import.meta.env.VITE_AUTO_TOKEN_DECIMALS ?? 9),
  rewardDecimals: Number(import.meta.env.VITE_AUTO_REWARD_DECIMALS ?? 6),
} as const;

export function isAutoTokenConfigured() {
  return autoStakingConfig.tokenMint.length > 0;
}

export function isStakingPoolConfigured() {
  return (
    isAutoTokenConfigured() && autoStakingConfig.stakePool.length > 0
  );
}

export function getStakingStatus(): "pending" | "token-only" | "live" {
  if (!isAutoTokenConfigured()) return "pending";
  if (!isStakingPoolConfigured()) return "token-only";
  return "live";
}
