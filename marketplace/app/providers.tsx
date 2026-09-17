import type { ReactNode } from "react";
import { WalletProvider } from "./hooks/use-wallet";

export function AppProviders({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
