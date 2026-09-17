import {
  ROBINHOOD_CHAIN_ID,
  ROBINHOOD_EXPLORER,
  getRobinhoodRpcUrl,
} from "../robinhood";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const CHAIN_HEX = `0x${ROBINHOOD_CHAIN_ID.toString(16)}`;

export async function ensureRobinhoodOnProvider(provider: Eip1193Provider) {
  const current = await provider.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === CHAIN_HEX) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }],
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? Number((error as { code: unknown }).code)
        : 0;
    if (code !== 4902) throw error;

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_HEX,
          chainName: "Robinhood Chain",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [getRobinhoodRpcUrl()],
          blockExplorerUrls: [ROBINHOOD_EXPLORER],
        },
      ],
    });
  }
}
