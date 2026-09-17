import { useCallback, useEffect, useRef, useState } from "react";
import { useSolanaWallet } from "./use-solana-wallet";
import { useWallet } from "./use-wallet";
import {
  fetchLoginNonce,
  hasActiveSession,
  loginWithWallet,
  logout as clearBackendToken,
} from "../lib/api/client";

export function useBackendSession() {
  const { ready, authenticated, address } = useSolanaWallet();
  const { signMessage } = useWallet();
  const [hasSession, setHasSession] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    setHasSession(hasActiveSession());
  }, [authenticated, address]);

  useEffect(() => {
    if (ready && !authenticated) {
      clearBackendToken();
      setHasSession(false);
      setSyncError(null);
      syncAttemptedRef.current = false;
    }
  }, [ready, authenticated]);

  const syncSession = useCallback(async () => {
    if (!address) {
      setSyncError("Connect a Robinhood wallet to use the marketplace.");
      return false;
    }

    setSyncing(true);
    setSyncError(null);

    try {
      const { message } = await fetchLoginNonce(address);
      const signature = await signMessage(message);
      await loginWithWallet(address, message, signature);
      setHasSession(true);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not connect to backend";
      setSyncError(`Account login failed: ${message}`);
      syncAttemptedRef.current = false;
      return false;
    } finally {
      setSyncing(false);
    }
  }, [address, signMessage]);

  useEffect(() => {
    syncAttemptedRef.current = false;
  }, [address]);

  useEffect(() => {
    if (!ready || !authenticated || !address) return;
    if (hasActiveSession()) {
      setHasSession(true);
      return;
    }
    if (syncAttemptedRef.current) return;

    syncAttemptedRef.current = true;
    void syncSession();
  }, [ready, authenticated, address, syncSession]);

  const logout = useCallback(() => {
    clearBackendToken();
    setHasSession(false);
    syncAttemptedRef.current = false;
  }, []);

  return {
    ready,
    authenticated,
    address,
    hasSession,
    syncing,
    syncError,
    syncSession,
    logout,
  };
}
