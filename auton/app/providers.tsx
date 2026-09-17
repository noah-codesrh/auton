import type { ReactNode } from "react";
import { PrivyProviders } from "./privy-providers.client";

export function AppProviders({ children }: { children: ReactNode }) {
  return <PrivyProviders>{children}</PrivyProviders>;
}
