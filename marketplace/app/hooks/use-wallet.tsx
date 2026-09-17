import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EvmTransferRequest } from "../lib/solana/usdc-transfer";
import {
  connectWallet,
  disconnectWallet,
  sendWalletTransaction,
  signWalletMessage,
  startWalletDiscovery,
  type WalletId,
} from "../lib/solana/wallets";

const STORAGE_KEY = "marketplace_wallet";

type StoredWallet = {
  walletId: WalletId;
  address: string;
};

type WalletContextValue = {
  ready: boolean;
  connected: boolean;
  address: string | null;
  walletId: WalletId | null;
  connecting: boolean;
  connect: (walletId: WalletId) => Promise<string>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signAndSendTransaction: (transaction: EvmTransferRequest) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function readStoredWallet(): StoredWallet | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredWallet;
  } catch {
    return null;
  }
}

function writeStoredWallet(value: StoredWallet | null) {
  if (typeof window === "undefined") return;

  if (!value) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [walletId, setWalletId] = useState<WalletId | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<Awaited<
    ReturnType<typeof connectWallet>
  > | null>(null);

  useEffect(() => {
    startWalletDiscovery();
    const stored = readStoredWallet();
    if (!stored) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void connectWallet(stored.walletId, { onlyIfTrusted: true })
      .then((session) => {
        if (cancelled) return;
        if (session.address.toLowerCase() !== stored.address.toLowerCase()) {
          writeStoredWallet(null);
          return;
        }
        setWalletId(session.walletId);
        setAddress(session.address);
        setProvider(session);
      })
      .catch(() => {
        writeStoredWallet(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (nextWalletId: WalletId) => {
    setConnecting(true);

    try {
      const session = await connectWallet(nextWalletId);
      setWalletId(session.walletId);
      setAddress(session.address);
      setProvider(session);
      writeStoredWallet({
        walletId: session.walletId,
        address: session.address,
      });
      return session.address;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet(walletId);
    setWalletId(null);
    setAddress(null);
    setProvider(null);
    writeStoredWallet(null);
  }, [walletId]);

  const signMessage = useCallback(
    async (message: string) => {
      if (!provider || !address) {
        throw new Error("Connect a wallet first.");
      }

      return signWalletMessage(provider.provider, address, message);
    },
    [address, provider],
  );

  const signAndSendTransaction = useCallback(
    async (transaction: EvmTransferRequest) => {
      if (!provider || !address) {
        throw new Error("Connect a wallet first.");
      }

      return sendWalletTransaction(provider.provider, address, transaction);
    },
    [address, provider],
  );

  const value = useMemo(
    () => ({
      ready,
      connected: Boolean(address),
      address,
      walletId,
      connecting,
      connect,
      disconnect,
      signMessage,
      signAndSendTransaction,
    }),
    [
      ready,
      address,
      walletId,
      connecting,
      connect,
      disconnect,
      signMessage,
      signAndSendTransaction,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return context;
}
