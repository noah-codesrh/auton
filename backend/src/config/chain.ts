import { defineChain, parseAbi } from "viem";

/** Robinhood Chain mainnet. Gas is ETH. */
export const ROBINHOOD_CHAIN_ID = 4663;

export const DEFAULT_ROBINHOOD_RPC =
  "https://rpc.mainnet.chain.robinhood.com";

export const ROBINHOOD_EXPLORER =
  "https://robinhoodchain.blockscout.com";

/**
 * Paxos Global Dollar (USDG) on Robinhood mainnet.
 * 6 decimals, ERC-20 proxy. Do not use impostor 0x8218…B5b4.
 */
export const USDG_TOKEN_ADDRESS =
  "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const;

export const USDG_TOKEN_DECIMALS = 6;

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
