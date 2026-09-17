import { defineChain, parseAbi, type Address } from "viem";

export const ROBINHOOD_CHAIN_ID = 4663;

export const DEFAULT_ROBINHOOD_RPC =
  "https://rpc.mainnet.chain.robinhood.com";

export const ROBINHOOD_EXPLORER =
  "https://robinhoodchain.blockscout.com";

export const USDG_TOKEN_ADDRESS =
  "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as Address;

export const USDG_TOKEN_DECIMALS = 6;

export function getRobinhoodRpcUrl() {
  return (
    import.meta.env.VITE_ROBINHOOD_RPC_URL?.trim() ||
    import.meta.env.VITE_SOLANA_RPC_URL?.trim() ||
    DEFAULT_ROBINHOOD_RPC
  );
}

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [DEFAULT_ROBINHOOD_RPC] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: ROBINHOOD_EXPLORER },
  },
});

export const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
