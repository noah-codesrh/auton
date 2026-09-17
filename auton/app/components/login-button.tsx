import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { isPrivyConfigured } from "../lib/privy-config";
import { LoginModal } from "./login-modal";

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function LoginButtonInner({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const { ready, authenticated, user, logout } = usePrivy();
  const isLight = variant === "light";
  const idle = isLight
    ? "border-black/20 text-black/50"
    : "border-white/20 text-white/50";
  const active = isLight
    ? "border-black/20 text-black hover:border-black/40"
    : "border-white/20 text-white hover:border-white/40";

  const evmWallet = user?.linkedAccounts?.find(
    (account) =>
      account.type === "wallet" &&
      "chainType" in account &&
      (account.chainType === "ethereum" || account.chainType === "evm"),
  );

  const walletAddress =
    evmWallet && "address" in evmWallet ? evmWallet.address : null;

  if (!ready) {
    return (
      <span className={`pixel-serif-logo rounded-lg border px-3 py-2 text-sm md:px-4 ${idle}`}>
        ...
      </span>
    );
  }

  if (authenticated) {
    return (
      <button
        type="button"
        onClick={() => logout()}
        className={`pixel-serif-logo rounded-lg border px-3 py-2 text-sm transition-colors md:px-4 ${active}`}
        title="Log out"
      >
        {walletAddress ? truncateAddress(walletAddress) : "Account"}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`pixel-serif-logo rounded-lg border px-3 py-2 text-sm transition-colors md:px-4 ${active}`}
      >
        Login
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function LoginButton({ variant = "dark" }: { variant?: "light" | "dark" }) {
  if (!isPrivyConfigured) {
    return (
      <span
        className="pixel-serif-logo rounded-lg border border-amber-500/30 px-3 py-2 text-xs text-amber-400/80 md:px-4"
        title="Set VITE_PRIVY_APP_ID to enable login"
      >
        Login
      </span>
    );
  }

  return <LoginButtonInner variant={variant} />;
}
