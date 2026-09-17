import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { isPrivyConfigured, PRIVY_APP_ID } from "./lib/privy-config";
import { robinhoodChain } from "./lib/robinhood";

export function PrivyProviders({ children }: { children: ReactNode }) {
  if (!isPrivyConfigured) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Auton] VITE_PRIVY_APP_ID is missing — wallet and Twitter login disabled.",
      );
    }
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          walletChainType: "ethereum-only",
          walletList: [
            "metamask",
            "coinbase_wallet",
            "rainbow",
            "phantom",
            "detected_ethereum_wallets",
            "wallet_connect",
          ],
        },
        defaultChain: robinhoodChain,
        supportedChains: [robinhoodChain],
        loginMethods: ["twitter", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
