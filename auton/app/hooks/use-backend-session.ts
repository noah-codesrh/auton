import { useCallback, useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallet } from "./use-solana-wallet";
import {
  hasActiveSession,
  loginWithPrivy,
  logout as clearBackendToken,
} from "../lib/api/autonClient";

/**
 * After Privy login, silently exchange the Privy access token for an Auton JWT
 * so dashboard data comes from Supabase (not frontend fallbacks).
 */
export function useBackendSession() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { address } = useSolanaWallet();
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
      setSyncError("No Robinhood wallet on your account.");
      return false;
    }

    setSyncing(true);
    setSyncError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setSyncError("Privy session not ready. Refresh and try again.");
        return false;
      }

      await loginWithPrivy(accessToken, address);
      setHasSession(true);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not connect to backend";
      setSyncError(message);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [address, getAccessToken]);

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
