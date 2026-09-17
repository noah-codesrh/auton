import { assertNoError, getSupabase } from "../db/supabase.js";
import { generateWorkerToken, hashWorkerToken } from "../utils/workerTokens.js";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export async function enrollProviderNode(userId: string, label = "native") {
  const supabase = getSupabase();
  const { plainKey, hash, prefix } = generateWorkerToken();

  const { data: node, error } = await supabase
    .from("provider_nodes")
    .insert({
      user_id: userId,
      worker_token_hash: hash,
      token_prefix: prefix,
      label,
      status: "offline",
    })
    .select("id, label, token_prefix, created_at")
    .single();

  assertNoError(error);

  if (!node) {
    throw new Error("Failed to enroll provider node");
  }

  const apiUrl = process.env.PUBLIC_API_URL?.trim() || "https://api.autonairh.xyz";

  return {
    nodeId: node.id,
    token: plainKey,
    tokenPrefix: node.token_prefix,
    label: node.label,
    warning: "Save this token now — it will not be shown again.",
    deployCommand: buildDeployCommand(apiUrl, plainKey),
  };
}

export function buildDeployCommand(apiUrl: string, token: string) {
  return [
    `export AUTON_API_URL="${apiUrl}"`,
    `export AUTON_WORKER_TOKEN="${token}"`,
    `curl -fsSL "${apiUrl}/api/v1/providers/worker.mjs" | node`,
  ].join("\n");
}

export async function recordWorkerHeartbeat(token: string, meta?: { version?: string }) {
  if (!token) return null;

  const supabase = getSupabase();
  const hash = hashWorkerToken(token);

  const { data: node, error: lookupError } = await supabase
    .from("provider_nodes")
    .select("id, user_id, jobs_completed")
    .eq("worker_token_hash", hash)
    .maybeSingle();

  assertNoError(lookupError);

  if (!node) return null;

  const { error: updateError } = await supabase
    .from("provider_nodes")
    .update({
      status: "online",
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", node.id);

  assertNoError(updateError);

  return {
    nodeId: node.id,
    userId: node.user_id,
    version: meta?.version ?? "unknown",
  };
}

export async function getNetworkStats() {
  try {
    const supabase = getSupabase();
    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();

    const { data: nodes, error } = await supabase
      .from("provider_nodes")
      .select("id, label, last_seen_at, status");

    assertNoError(error);

    const all = nodes ?? [];
    const online = all.filter(
      (node) => node.last_seen_at && node.last_seen_at >= cutoff,
    );
    const nativeOnline = online.filter((node) => node.label === "native").length;
    const browserOnline = online.filter((node) => node.label === "browser").length;

    return {
      orchestrator: "connected",
      workersOnline: online.length,
      workersNative: nativeOnline,
      workersBrowser: browserOnline,
      workersTotal: all.length,
      queueDepth: 0,
    };
  } catch {
    return {
      orchestrator: "connected",
      workersOnline: 0,
      workersNative: 0,
      workersBrowser: 0,
      workersTotal: 0,
      queueDepth: 0,
    };
  }
}

export async function getProviderStatus(userId: string) {
  try {
    const supabase = getSupabase();
    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();

    const { data: nodes, error } = await supabase
      .from("provider_nodes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    assertNoError(error);

    const rows = nodes ?? [];
    const onlineNode = rows.find(
      (node) => node.last_seen_at && node.last_seen_at >= cutoff,
    );

    const earnings = rows.reduce(
      (sum, node) => sum + Number(node.earnings_usdc),
      0,
    );
    const jobs = rows.reduce(
      (sum, node) => sum + Number(node.jobs_completed),
      0,
    );

    return {
      status: onlineNode ? ("online" as const) : rows.length > 0 ? ("offline" as const) : ("idle" as const),
      earningsUsdc: earnings.toFixed(2),
      jobsCompleted: jobs,
      nodes: rows.map((node) => ({
        id: node.id,
        label: node.label,
        status:
          node.last_seen_at && node.last_seen_at >= cutoff ? "online" : "offline",
        tokenPrefix: node.token_prefix,
        lastSeenAt: node.last_seen_at,
        createdAt: node.created_at,
      })),
    };
  } catch {
    return {
      status: "idle" as const,
      earningsUsdc: "0.00",
      jobsCompleted: 0,
      nodes: [],
    };
  }
}

export function getWorkerScriptSource() {
  return `#!/usr/bin/env node
/**
 * Auton provider worker — minimal heartbeat node.
 * Set AUTON_API_URL and AUTON_WORKER_TOKEN before running.
 */
const API = process.env.AUTON_API_URL || "${process.env.PUBLIC_API_URL?.trim() || "https://api.autonairh.xyz"}";
const TOKEN = process.env.AUTON_WORKER_TOKEN;

if (!TOKEN) {
  console.error("[auton-worker] Missing AUTON_WORKER_TOKEN");
  process.exit(1);
}

const VERSION = "0.1.0";

async function heartbeat() {
  const res = await fetch(API + "/api/v1/providers/heartbeat", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version: VERSION }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Heartbeat failed (" + res.status + "): " + text);
  }
}

console.log("[auton-worker] Auton provider node v" + VERSION);
console.log("[auton-worker] API:", API);
console.log("[auton-worker] Press Ctrl+C to stop\\n");

await heartbeat();
console.log("[auton-worker] Connected to orchestrator");

setInterval(() => {
  heartbeat().catch((err) => {
    console.error("[auton-worker]", err.message || err);
  });
}, 30_000);
`;
}
