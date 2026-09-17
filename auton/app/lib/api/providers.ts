import { getBackendUrl, getToken, request } from "./autonClient";

export type ProviderNetworkStats = {
  orchestrator: string;
  workersOnline: number;
  workersNative: number;
  workersBrowser: number;
  workersTotal: number;
  queueDepth: number;
};

export type ProviderStatus = {
  status: "online" | "offline" | "idle";
  earningsUsdc: string;
  jobsCompleted: number;
  nodes: Array<{
    id: string;
    label: string;
    status: string;
    tokenPrefix: string;
    lastSeenAt: string | null;
    createdAt: string;
  }>;
};

export type EnrollResult = {
  nodeId: string;
  token: string;
  tokenPrefix: string;
  label: string;
  warning: string;
  deployCommand: string;
};

const FALLBACK_NETWORK: ProviderNetworkStats = {
  orchestrator: "connected",
  workersOnline: 0,
  workersNative: 0,
  workersBrowser: 0,
  workersTotal: 0,
  queueDepth: 0,
};

export async function fetchProviderNetwork() {
  try {
    return await request<ProviderNetworkStats>(
      "/api/v1/providers/network",
    );
  } catch {
    return FALLBACK_NETWORK;
  }
}

export async function fetchProviderStatus() {
  if (!getToken()) return null;
  try {
    return await request<ProviderStatus>("/api/v1/providers/status");
  } catch {
    return null;
  }
}

export async function enrollProviderNode(label: "native" | "browser" = "native") {
  return request<EnrollResult>("/api/v1/providers/enroll", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export function getWorkerInstallSnippet(apiUrl: string, token: string) {
  return [
    `export AUTON_API_URL="${apiUrl}"`,
    `export AUTON_WORKER_TOKEN="${token}"`,
    `curl -fsSL "${apiUrl}/api/v1/providers/worker.mjs" | node`,
  ].join("\n");
}

export function getBackendApiUrl() {
  return getBackendUrl();
}
