import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useBackendSession } from "../hooks/use-backend-session";
import { useDashboard } from "../hooks/use-dashboard";
import { useAutonConfig } from "../hooks/use-auton-config";
import { getBackendUrl } from "../lib/api/autonClient";
import { getGatewayUrl } from "../lib/api/public-config";
import { BackendStatusBadge } from "./backend-status-badge";
import { LoginModal } from "./login-modal";

const backendUrl = getBackendUrl();

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatTokens(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/15 bg-black/[0.02] p-5 md:p-6">
      <div
        className={`pixel-serif text-2xl md:text-3xl ${accent ? "text-emerald-600" : "text-black"}`}
      >
        {value}
      </div>
      <div className="pixel-sans mt-2 text-sm text-black/60">{label}</div>
      {sub && (
        <div className="pixel-sans mt-1 text-xs text-black/40">{sub}</div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const highlightTier = searchParams.get("tier");

  const [loginOpen, setLoginOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  const { ready, authenticated, address, hasSession, syncing, syncError, syncSession } =
    useBackendSession();

  const { data, loading, newKey, setNewKey, generateKey } = useDashboard(
    authenticated && hasSession,
  );
  const { config } = useAutonConfig();
  const gatewayUrl = config ? getGatewayUrl(config) : `${backendUrl}/api/v1/gateway/v1/chat/completions`;

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    setCreatingKey(true);
    try {
      await generateKey(keyName.trim());
      setKeyName("");
    } finally {
      setCreatingKey(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="pixel-serif text-3xl text-black md:text-4xl">
            Dashboard
          </h1>
          <p className="pixel-sans mt-4 max-w-3xl text-sm leading-relaxed text-black/60 md:text-base">
            Manage API keys, forward compute balances, and staking yield. Route
            agents through the OpenAI-compatible gateway.
          </p>
          <div className="mt-3">
            <BackendStatusBadge variant="light" />
          </div>
          {address && (
            <p className="pixel-sans mt-3 text-xs text-black/40">
              wallet: {truncateAddress(address)}
            </p>
          )}
        </div>

        {!ready && (
          <p className="pixel-sans text-sm text-black/50">Loading wallet...</p>
        )}

        {ready && !authenticated && (
          <div className="rounded-2xl border border-black/15 p-6 text-center">
            <p className="pixel-sans text-sm text-black/60">
              Connect your Solana wallet to access your dashboard.
            </p>
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="pixel-serif mt-4 rounded-xl border border-black/20 px-6 py-3 text-sm text-black transition-colors hover:border-black/40"
            >
              Connect wallet
            </button>
          </div>
        )}

        {ready && authenticated && !hasSession && (
          <div className="rounded-2xl border border-black/15 p-6 text-center">
            <p className="pixel-sans text-sm text-black/60">
              {syncing
                ? "Connecting to Auton backend..."
                : syncError
                  ? "Could not load your account from the backend."
                  : "Preparing your dashboard..."}
            </p>
            {syncError && (
              <p className="pixel-sans mt-2 whitespace-pre-line text-xs text-red-600/90">
                {syncError}
              </p>
            )}
            {syncError && !syncing && (
              <button
                type="button"
                onClick={() => void syncSession()}
                className="pixel-serif mt-4 rounded-xl border border-black/20 px-6 py-3 text-sm text-black transition-colors hover:border-black/40"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {ready && authenticated && hasSession && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Active API keys"
                value={loading ? "..." : String(data.apiKeys.length)}
              />
              <StatCard
                label="Compute contracts"
                value={loading ? "..." : String(data.computeBalances.length)}
                sub="forward tiers"
              />
              <StatCard
                label="Claimable USDC"
                value={loading ? "..." : `$${data.staking.claimableUsdcYield}`}
                accent
                sub={
                  Number(data.staking.claimableUsdcYield) > 0
                    ? "from staking yield"
                    : undefined
                }
              />
            </div>

            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="pixel-serif text-xl text-black">
                  Forward compute balances
                </h2>
                <Link
                  to="/markets"
                  className="pixel-sans text-xs text-[#80a0c1] transition-colors hover:text-[#80a0c1]/80"
                >
                  Browse marketplace →
                </Link>
              </div>

              {highlightTier && (
                <p className="pixel-sans mb-3 text-xs text-emerald-600/90">
                  Showing contract: {highlightTier}
                </p>
              )}

              <div className="overflow-hidden rounded-2xl border border-black/15">
                <table className="pixel-sans w-full text-left text-sm">
                  <thead className="border-b border-black/10 bg-black/[0.02] text-xs text-black/40">
                    <tr>
                      <th className="px-4 py-3 font-normal">Tier</th>
                      <th className="px-4 py-3 font-normal">Balance</th>
                      <th className="px-4 py-3 font-normal">Expiry</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.computeBalances.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-black/40"
                        >
                          No active contracts.{" "}
                          <Link to="/markets" className="text-[#80a0c1]">
                            Purchase a tier
                          </Link>
                        </td>
                      </tr>
                    )}
                    {data.computeBalances.map((balance) => (
                      <tr
                        key={balance.id}
                        className={`border-b border-black/5 last:border-0 ${
                          highlightTier === balance.modelTier
                            ? "bg-emerald-500/10"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-black">
                          {balance.modelTier}
                        </td>
                        <td className="px-4 py-3 text-emerald-600">
                          {formatTokens(balance.tokenBalanceRemaining)} tokens
                        </td>
                        <td className="px-4 py-3 text-black/60">
                          {new Date(balance.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-xs ${
                              balance.isExpired
                                ? "border-red-500/30 text-red-600"
                                : "border-emerald-500/30 text-emerald-600"
                            }`}
                          >
                            {balance.isExpired ? "Expired" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="pixel-serif mb-4 text-xl text-black">API keys</h2>
              <p className="pixel-sans mb-4 text-sm text-black/50">
                Use these keys as Bearer tokens against the Auton gateway.
              </p>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                  placeholder="Key name (e.g. production-agent)"
                  className="pixel-sans flex-1 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 focus:border-black/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateKey}
                  disabled={creatingKey || !keyName.trim()}
                  className="pixel-serif rounded-xl border border-black/15 bg-black/[0.06] px-6 py-3 text-sm text-black transition-colors hover:border-black/30 disabled:opacity-40"
                >
                  {creatingKey ? "Creating..." : "Create key"}
                </button>
              </div>

              {newKey && (
                <div className="pixel-sans mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <p className="text-amber-800/90">
                    Copy this key now — it won&apos;t be shown again.
                  </p>
                  <code className="mt-2 block break-all text-xs text-black/80">
                    {newKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => setNewKey(null)}
                    className="mt-3 text-xs text-black/50 hover:text-black"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {data.apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3"
                  >
                    <div>
                      <div className="pixel-sans text-sm text-black">
                        {key.name}
                      </div>
                      <div className="pixel-sans text-xs text-black/40">
                        {key.key_prefix} ·{" "}
                        {new Date(key.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`pixel-sans rounded-md border px-2 py-0.5 text-xs ${
                        key.active
                          ? "border-emerald-500/30 text-emerald-600"
                          : "border-black/20 text-black/40"
                      }`}
                    >
                      {key.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10 rounded-2xl border border-black/15 bg-black/[0.02] p-5 md:p-6">
              <h2 className="pixel-serif mb-3 text-lg text-black">
                Gateway endpoint
              </h2>
              <p className="pixel-sans mb-4 text-sm text-black/50">
                Point any OpenAI-compatible client here. Authorization uses your
                Auton API key.
              </p>
              <code className="pixel-sans block overflow-x-auto rounded-lg border border-black/10 bg-black/[0.04] px-4 py-3 text-xs text-[#80a0c1]">
                {gatewayUrl}
              </code>
            </section>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/staking"
                className="pixel-sans text-sm text-[#80a0c1] transition-colors hover:text-[#80a0c1]/80"
              >
                Manage staking →
              </Link>
              <Link
                to="/treasury"
                className="pixel-sans text-sm text-[#80a0c1] transition-colors hover:text-[#80a0c1]/80"
              >
                View treasury →
              </Link>
            </div>
          </>
        )}
      </main>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
