import { usePrivy } from "@privy-io/react-auth";

function isEvmWallet(account: {
  type: string;
  chainType?: string;
}) {
  return (
    account.type === "wallet" &&
    (account.chainType === "ethereum" || account.chainType === "evm")
  );
}

export function useSolanaWallet() {
  const { ready, authenticated, user } = usePrivy();

  const evmWallet = user?.linkedAccounts?.find(
    (account) =>
      account.type === "wallet" &&
      "chainType" in account &&
      isEvmWallet(account),
  );

  const address =
    evmWallet && "address" in evmWallet ? evmWallet.address : null;

  return {
    ready,
    authenticated,
    address,
  };
}
