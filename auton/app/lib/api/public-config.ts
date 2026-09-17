import { getBackendUrl } from "./autonClient";

export type AutonPublicConfig = {
  autoTokenMint: string;
  masterVaultWallet: string;
  autoTokenDecimals: number;
  usdcTokenMint: string;
  usdcTokenDecimals: number;
  marketplacePaymentRequired: boolean;
  gatewayPath: string;
};

const emptyConfig: AutonPublicConfig = {
  autoTokenMint: "",
  masterVaultWallet: "",
  autoTokenDecimals: 6,
  usdcTokenMint: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  usdcTokenDecimals: 6,
  marketplacePaymentRequired: true,
  gatewayPath: "/api/v1/gateway/v1/chat/completions",
};

let cached: AutonPublicConfig | null = null;

function envOverrides(): Partial<AutonPublicConfig> {
  return {
    autoTokenMint: import.meta.env.VITE_AUTO_TOKEN_MINT?.trim() || undefined,
    masterVaultWallet:
      import.meta.env.VITE_MASTER_VAULT_WALLET?.trim() || undefined,
    autoTokenDecimals: import.meta.env.VITE_AUTO_TOKEN_DECIMALS
      ? Number(import.meta.env.VITE_AUTO_TOKEN_DECIMALS)
      : undefined,
  };
}

export async function fetchPublicConfig(): Promise<AutonPublicConfig> {
  if (cached) return { ...cached, ...pickDefined(envOverrides()) };

  try {
    const response = await fetch(`${getBackendUrl()}/api/v1/config`);
    if (!response.ok) throw new Error(`config ${response.status}`);

    const data = (await response.json()) as Partial<AutonPublicConfig>;
    cached = {
      ...emptyConfig,
      ...data,
      marketplacePaymentRequired:
        data.marketplacePaymentRequired ?? emptyConfig.marketplacePaymentRequired,
    };
    return { ...cached, ...pickDefined(envOverrides()) };
  } catch {
    const overrides = envOverrides();
    return {
      ...emptyConfig,
      ...pickDefined(overrides),
      autoTokenMint: overrides.autoTokenMint ?? "",
      masterVaultWallet: overrides.masterVaultWallet ?? "",
      autoTokenDecimals: overrides.autoTokenDecimals ?? 6,
    };
  }
}

export function getGatewayUrl(config: AutonPublicConfig) {
  return `${getBackendUrl()}${config.gatewayPath}`;
}

function pickDefined<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
