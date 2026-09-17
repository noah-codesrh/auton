/**
 * $AUTO treasury config — set when the token launches:
 * VITE_AUTO_TOKEN_MINT, VITE_AUTO_TREASURY_API_URL
 */
export const autoTreasuryConfig = {
  tokenMint: import.meta.env.VITE_AUTO_TOKEN_MINT?.trim() ?? "",
  treasuryApiUrl: import.meta.env.VITE_AUTO_TREASURY_API_URL?.trim() ?? "",
  /** On-chain Streamflow vesting / lock contract (mainnet). */
  streamflowLockUrl:
    "https://app.streamflow.finance/contract/solana/mainnet/BPwfoyr9XqmNyTVqRzTA5jTT9UcwWXoSx8eyQr5BsAEs?utm_source=twitter&utm_medium=app",
  /** Total $AUTO locked via Streamflow (human-readable token units). */
  lockedAutoTokens: 34_000_000,
  /** USDC spent on completed buybacks. */
  buybacksUsdcCompleted: 1_200,
};

export function isTreasuryConfigured() {
  return autoTreasuryConfig.tokenMint.length > 0;
}

export function getTreasuryStatus(): "pending" | "live" {
  return isTreasuryConfigured() ? "live" : "pending";
}
