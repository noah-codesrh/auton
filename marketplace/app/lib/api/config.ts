import { getBackendUrl } from "./client";

export type PublicConfig = {
  autoTokenMint: string;
  masterVaultWallet: string;
  autoTokenDecimals: number;
  usdcTokenMint: string;
  usdcTokenDecimals: number;
  marketplacePaymentRequired: boolean;
  gatewayPath: string;
  chatCompletionsPath: string;
  chatRateMultiplier: number;
  chatMinTopUpUsd: number;
};

export async function fetchPublicConfig(): Promise<PublicConfig> {
  const response = await fetch(`${getBackendUrl()}/api/v1/config`);
  if (!response.ok) {
    throw new Error(`Failed to load config (${response.status})`);
  }

  return response.json() as Promise<PublicConfig>;
}

export function getGatewayUrl(config: PublicConfig) {
  return `${getBackendUrl()}${config.gatewayPath}`;
}
