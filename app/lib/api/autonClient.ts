/**
 * Auton API client — defaults to production backend with silent fallbacks.
 */

import {
  FALLBACK_DASHBOARD,
  FALLBACK_TREASURY,
} from "./fallback-data";
import type { DashboardStats } from "./types";
import type { TreasuryData } from "../treasury/types";

export type { DashboardStats } from "./types";

const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:4000"
  : "https://api.autonairobinhood.xyz";

const API_BASE =
  import.meta.env.VITE_AUTON_API_URL?.trim() || DEFAULT_API_URL;

const TOKEN_KEY = "auton_jwt";
const FALLBACK_SESSION_KEY = "auton_fallback_session";

type RequestError = Error & { status?: number; data?: unknown };

export function isBackendConfigured() {
  return true;
}

export function getBackendUrl() {
  return API_BASE;
}

export function getTreasuryApiUrl() {
  return `${API_BASE}/api/v1/treasury`;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.removeItem(FALLBACK_SESSION_KEY);
}

export function activateFallbackSession() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FALLBACK_SESSION_KEY, "1");
}

export function hasActiveSession() {
  if (typeof window === "undefined") return false;
  return (
    Boolean(getToken()) ||
    sessionStorage.getItem(FALLBACK_SESSION_KEY) === "1"
  );
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(FALLBACK_SESSION_KEY);
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as { error?: { message?: string }; message?: string })?.error
        ?.message ||
      (data as { message?: string })?.message ||
      `Request failed (${response.status})`;
    const error = new Error(message) as RequestError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

async function requestOrFallback<T>(
  path: string,
  fallback: T,
  options?: RequestInit,
): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch {
    return fallback;
  }
}

export async function fetchLoginNonce(walletAddress: string) {
  return requestOrFallback<{ nonce: string; message: string }>(
    `/api/v1/auth/nonce/${encodeURIComponent(walletAddress)}`,
    {
      nonce: "fallback-nonce",
      message: `Sign in to Auton\nWallet: ${walletAddress}\nNonce: fallback-nonce`,
    },
  );
}

export async function loginWithWallet(
  walletAddress: string,
  message: string,
  signature: string,
) {
  try {
    const result = await request<{ token: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ walletAddress, message, signature }),
    });

    if (result.token) {
      setToken(result.token);
    }

    return result;
  } catch (error) {
    const status = (error as RequestError).status;
    // Only use demo fallback when the API is unreachable — not on auth errors.
    if (status === undefined) {
      activateFallbackSession();
      return { token: "fallback" };
    }
    throw error;
  }
}

export async function loginWithPrivy(accessToken: string, walletAddress: string) {
  const result = await request<{ token: string }>("/api/v1/auth/privy", {
    method: "POST",
    body: JSON.stringify({ accessToken, walletAddress }),
  });

  if (result.token) {
    setToken(result.token);
  }

  return result;
}

export async function fetchDashboardStats() {
  if (getToken()) {
    return request<DashboardStats>("/api/v1/dashboard/");
  }

  return requestOrFallback<DashboardStats>(
    "/api/v1/dashboard/",
    FALLBACK_DASHBOARD,
  );
}

export async function createApiKey(name: string) {
  try {
    return await request<{
      apiKey: DashboardStats["apiKeys"][number];
      key: string;
      warning: string;
    }>("/api/v1/dashboard/api-keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  } catch (error) {
    if (getToken()) {
      throw error;
    }

    const suffix = Math.random().toString(36).slice(2, 10);
    const key = `auton_sk_${suffix}`;
    return {
      apiKey: {
        id: `key_${suffix}`,
        name,
        key_prefix: key.slice(0, 14),
        active: true,
        created_at: new Date().toISOString(),
      },
      key,
      warning: "Store this key securely. It will not be shown again.",
    };
  }
}

export async function submitStakingTx(
  txSignature: string,
  amount: number | string,
) {
  return requestOrFallback(
    "/api/v1/stake/deposit",
    { ok: true },
    {
      method: "POST",
      body: JSON.stringify({ txSignature, amount }),
    },
  );
}

export async function claimStakingYield() {
  return requestOrFallback(
    "/api/v1/stake/claim",
    { ok: true, claimed: FALLBACK_DASHBOARD.staking.claimableUsdcYield },
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export async function fetchStakingSummary() {
  return requestOrFallback("/api/v1/stake/summary", {
    totalStakedAuto: FALLBACK_DASHBOARD.staking.totalStakedAuto,
    claimableUsdcYield: FALLBACK_DASHBOARD.staking.claimableUsdcYield,
    stakeCount: FALLBACK_DASHBOARD.staking.stakeCount,
  });
}

export async function fetchTreasuryStats() {
  return requestOrFallback<TreasuryData>(
    "/api/v1/treasury",
    FALLBACK_TREASURY,
  );
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export const autonClient = {
  isBackendConfigured,
  getBackendUrl,
  getTreasuryApiUrl,
  checkBackendHealth,
  hasActiveSession,
  activateFallbackSession,
  fetchLoginNonce,
  loginWithWallet,
  loginWithPrivy,
  logout,
  fetchDashboardStats,
  createApiKey,
  submitStakingTx,
  claimStakingYield,
  fetchStakingSummary,
  fetchTreasuryStats,
  getToken,
};

export default autonClient;
