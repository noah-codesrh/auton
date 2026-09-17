const API_BASE =
  import.meta.env.VITE_AUTON_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://api.autonairh.xyz");
const TOKEN_KEY = "marketplace_jwt";

type RequestError = Error & { status?: number; data?: unknown };

export function getBackendUrl() {
  return API_BASE;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function hasActiveSession() {
  return Boolean(getToken());
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
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

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "this app";
    const hint =
      error instanceof Error && error.message === "Failed to fetch"
        ? `Could not reach Auton backend at ${API_BASE}. Make sure the backend is running (pnpm dev in backend/) and CORS allows ${origin}.`
        : error instanceof Error
          ? error.message
          : "Network request failed";
    throw new Error(hint);
  }

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

export async function loginWithWallet(
  walletAddress: string,
  message: string,
  signature: string,
) {
  const result = await request<{ token: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ walletAddress, message, signature }),
  });

  if (result.token) {
    setToken(result.token);
  }

  return result;
}

export async function fetchLoginNonce(walletAddress: string) {
  return request<{ nonce: string; message: string }>(
    `/api/v1/auth/nonce/${encodeURIComponent(walletAddress)}`,
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
