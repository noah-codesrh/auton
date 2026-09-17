import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "../hooks/use-wallet";
import {
  listWalletOptions,
  requestWalletDiscovery,
  subscribeWalletDiscovery,
  waitForWalletDiscovery,
  type WalletId,
  type WalletOption,
} from "../lib/solana/wallets";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

function LoginModalShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl md:p-8">
        {children}
      </div>
    </div>,
    document.body,
  );
}

function WalletButton({
  wallet,
  busy,
  connectingThis,
  onClick,
}: {
  wallet: WalletOption;
  busy: boolean;
  connectingThis: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="pixel-sans flex w-full items-center justify-between rounded-full border border-black/10 px-4 py-3 text-sm text-black hover:bg-black/[0.03] disabled:opacity-50"
    >
      <span className="flex min-w-0 items-center gap-3">
        {wallet.icon ? (
          <img
            src={wallet.icon}
            alt=""
            className="h-5 w-5 shrink-0 rounded-sm"
          />
        ) : null}
        <span className="truncate">
          {connectingThis ? "Connecting..." : wallet.label}
        </span>
      </span>
      {wallet.detected ? (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-emerald-700">
          Detected
        </span>
      ) : wallet.installUrl ? (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-black/35">
          Install
        </span>
      ) : null}
    </button>
  );
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { connected, connecting, connect } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<WalletId | null>(null);
  const [options, setOptions] = useState<WalletOption[]>([]);

  useEffect(() => {
    const refresh = () => setOptions(listWalletOptions());
    refresh();
    return subscribeWalletDiscovery(refresh);
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setActiveWallet(null);
      return;
    }

    requestWalletDiscovery();
    setOptions(listWalletOptions());

    const timers = [80, 250, 600, 1200].map((ms) =>
      window.setTimeout(() => {
        requestWalletDiscovery();
        setOptions(listWalletOptions());
      }, ms),
    );

    void waitForWalletDiscovery(350).then(() => {
      setOptions(listWalletOptions());
    });

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (connected && open) {
      onClose();
    }
  }, [connected, open, onClose]);

  const detected = useMemo(
    () => options.filter((wallet) => wallet.detected),
    [options],
  );
  const others = useMemo(
    () => options.filter((wallet) => !wallet.detected),
    [options],
  );

  const handleConnect = async (wallet: WalletOption) => {
    if (!wallet.detected && wallet.installUrl) {
      window.open(wallet.installUrl, "_blank", "noopener,noreferrer");
      setError(
        `${wallet.label} is not in this Chrome profile. Install it, refresh, then connect.`,
      );
      return;
    }

    setActiveWallet(wallet.id);
    setError(null);

    try {
      await connect(wallet.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect wallet",
      );
    } finally {
      setActiveWallet(null);
    }
  };

  return (
    <LoginModalShell open={open} onClose={onClose}>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          className="text-black/40 hover:text-black"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="pixel-serif text-2xl text-black">Connect wallet</h2>
          <p className="pixel-sans mt-2 text-sm text-black/50">
            EVM wallets on Robinhood Chain. Extensions in this Chrome profile
            are listed first.
          </p>
        </div>

        {error && (
          <p className="pixel-sans rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="max-h-80 space-y-5 overflow-y-auto">
          {detected.length > 0 && (
            <div className="space-y-3">
              <p className="pixel-sans text-[10px] uppercase tracking-widest text-black/35">
                In this Chrome profile
              </p>
              {detected.map((wallet) => (
                <WalletButton
                  key={wallet.id}
                  wallet={wallet}
                  busy={connecting}
                  connectingThis={activeWallet === wallet.id}
                  onClick={() => void handleConnect(wallet)}
                />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-3">
              <p className="pixel-sans text-[10px] uppercase tracking-widest text-black/35">
                Other EVM wallets
              </p>
              {others.map((wallet) => (
                <WalletButton
                  key={wallet.id}
                  wallet={wallet}
                  busy={connecting}
                  connectingThis={activeWallet === wallet.id}
                  onClick={() => void handleConnect(wallet)}
                />
              ))}
            </div>
          )}

          {options.length === 0 && (
            <p className="pixel-sans text-sm text-black/45">
              No EVM wallet found. Install MetaMask, Rabby, or Coinbase Wallet
              and refresh.
            </p>
          )}
        </div>
      </div>
    </LoginModalShell>
  );
}
