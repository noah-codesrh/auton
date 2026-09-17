import { useWallet } from "./use-wallet";

export function useSolanaWallet() {
  const { ready, connected, address } = useWallet();

  return {
    ready,
    authenticated: connected,
    address,
  };
}
