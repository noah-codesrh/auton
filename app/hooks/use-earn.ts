import { useCallback, useEffect, useState } from "react";
import {
  enrollProviderNode,
  fetchProviderNetwork,
  fetchProviderStatus,
  type EnrollResult,
  type ProviderNetworkStats,
  type ProviderStatus,
} from "../lib/api/providers";

export function useEarn(enabled: boolean) {
  const [network, setNetwork] = useState<ProviderNetworkStats | null>(null);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<EnrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [networkStats, providerStatus] = await Promise.all([
        fetchProviderNetwork(),
        enabled ? fetchProviderStatus() : Promise.resolve(null),
      ]);
      setNetwork(networkStats);
      setStatus(providerStatus);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  const enroll = useCallback(
    async (label: "native" | "browser" = "native") => {
      setEnrolling(true);
      setError(null);
      try {
        const result = await enrollProviderNode(label);
        setEnrollResult(result);
        await refresh();
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not enroll worker";
        setError(message);
        throw err;
      } finally {
        setEnrolling(false);
      }
    },
    [refresh],
  );

  return {
    network,
    status,
    loading,
    enrolling,
    enrollResult,
    error,
    enroll,
    refresh,
  };
}

export function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export async function detectWebGpu(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    gpu?: { requestAdapter: () => Promise<unknown> };
  };
  if (!nav.gpu) return false;
  try {
    const adapter = await nav.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}
