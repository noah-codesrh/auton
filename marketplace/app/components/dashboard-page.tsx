import { Component, type ReactNode, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { contractLabel } from "../config/marketplace";
import { useAutoBalance } from "../hooks/use-auto-balance";
import { useBackendSession } from "../hooks/use-backend-session";
import { useConfig } from "../hooks/use-config";
import { useDashboard } from "../hooks/use-dashboard";
import { useSolanaWallet } from "../hooks/use-solana-wallet";
import { getBackendUrl } from "../lib/api/client";
import { getGatewayUrl } from "../lib/api/config";
import { formatAutoAmount } from "../lib/solana/auto-balance";
import { LoginModal } from "./login-modal";
import { SuccessOverlay } from "./success-check";

function formatTokens(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

function parseTokenAmount(value: string | undefined) {
  if (!value) return 0n;

  try {
    if (!/^\d+$/.test(value.trim())) return 0n;
    return BigInt(value);
  } catch {
    return 0n;
  }
}

class DashboardErrorPanel extends Component<
  { error: Error | null },
  { open: boolean }
> {
  state = { open: false };

  render() {
    const message =
      this.props.error?.message ?? "Something went wrong loading your account.";

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="pixel-sans text-sm text-red-800">
          Could not load account details.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ open: !this.state.open })}
          className="pixel-sans mt-2 text-xs text-red-700 underline"
        >
          {this.state.open ? "Hide details" : "Show details"}
        </button>
        {this.state.open && (
          <pre className="pixel-mono mt-3 overflow-x-auto text-xs text-red-900">
            {message}
          </pre>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="pixel-sans mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm text-black"
        >
          Reload page
        </button>
      </div>
    );
  }
}

class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <DashboardErrorPanel error={this.state.error} />;
    }

    return this.props.children;
  }
}

function DashboardBody() {
  const [searchParams] = useSearchParams();
  const highlightTier = searchParams.get("tier");

  const [loginOpen, setLoginOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [createKeyError, setCreateKeyError] = useState<string | null>(null);
  const [copiedGateway, setCopiedGateway] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showKeyCreated, setShowKeyCreated] = useState(false);

  const { ready, authenticated, hasSession, syncing, syncError, syncSession } =
    useBackendSession();
  const { address } = useSolanaWallet();
  const {
    walletAuto,
    walletAutoDisplay,
    loading: autoLoading,
    error: autoError,
    mintConfigured,
  } = useAutoBalance(address);
  const { config, loading: configLoading, error: configError } = useConfig();

  const { data, loading, error, newKey, setNewKey, generateKey } = useDashboard(
    authenticated && hasSession,
  );

  const gatewayUrl = config
    ? getGatewayUrl(config)
    : `${getBackendUrl()}/api/v1/gateway/v1/chat/completions`;

  const autoDecimals = config?.autoTokenDecimals ?? 6;
  const stakedAuto = hasSession
    ? parseTokenAmount(data.staking?.totalStakedAuto)
    : 0n;
  const walletAutoAmount = walletAuto ?? 0n;
  const totalAutoDisplay = formatAutoAmount(
    walletAutoAmount + stakedAuto,
    autoDecimals,
  );
  const stakedAutoDisplay = formatAutoAmount(stakedAuto, autoDecimals);

  const showWallet = Boolean(address);
  const showAccountBody = ready && authenticated && showWallet;

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    setCreatingKey(true);
    setCreateKeyError(null);

    try {
      await generateKey(keyName.trim());
      setKeyName("");
      setShowKeyCreated(true);
    } catch (err) {
      setCreateKeyError(
        err instanceof Error ? err.message : "Couldn't create key",
      );
    } finally {
      setCreatingKey(false);
    }
  };

  const copyGateway = async () => {
    await navigator.clipboard.writeText(gatewayUrl);
    setCopiedGateway(true);
    setTimeout(() => setCopiedGateway(false), 2000);
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <>
      {showWallet && address && (
        <div className="mb-8 flex items-start gap-2">
          <code className="pixel-mono min-w-0 flex-1 break-all text-sm text-black/70">
            {address}
          </code>
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="pixel-sans shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-xs text-black hover:bg-black/5"
          >
            {copiedAddress ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {!ready && (
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 text-center">
          <p className="pixel-sans text-sm text-black/60">Loading wallet...</p>
        </div>
      )}

      {ready && !authenticated && (
        <div className="rounded-2xl border border-black/10 p-8 text-center">
          <p className="pixel-sans text-black/60">Connect wallet to continue</p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="pixel-sans mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Connect wallet
          </button>
        </div>
      )}

      {ready && authenticated && !showWallet && (
        <div className="rounded-2xl border border-black/10 p-8 text-center">
          <p className="pixel-sans text-black/60">
            No wallet linked. Connect a Robinhood wallet to see your account.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="pixel-sans mt-4 rounded-xl border border-black/15 px-6 py-3 text-sm text-black hover:bg-black/5"
          >
            Connect wallet
          </button>
        </div>
      )}

      {showAccountBody && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-5">
            <h2 className="pixel-serif mb-4 text-lg text-black">$AUTO</h2>

            {configError && (
              <p className="pixel-sans text-sm text-amber-800">
                Config unavailable: {configError}
              </p>
            )}

            {!configError && (configLoading || !mintConfigured) && (
              <p className="pixel-sans text-sm text-black/60">
                Loading token config...
              </p>
            )}

            {!configError && mintConfigured && autoLoading && (
              <p className="pixel-sans text-sm text-black/60">
                Loading balance...
              </p>
            )}

            {!configError && mintConfigured && autoError && (
              <p className="pixel-sans text-sm text-red-600">{autoError}</p>
            )}

            {!configError && mintConfigured && !autoLoading && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="pixel-sans text-sm text-black/50">Total</span>
                  <span className="pixel-serif text-2xl text-emerald-700">
                    {totalAutoDisplay} AUTO
                  </span>
                </div>

                <div className="grid gap-2 border-t border-black/10 pt-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="pixel-sans text-black/50">In wallet</span>
                    <span className="pixel-mono text-black/80">
                      {walletAutoDisplay ?? "0"} AUTO
                    </span>
                  </div>
                  {hasSession && stakedAuto > 0n && (
                    <div className="flex justify-between gap-4">
                      <span className="pixel-sans text-black/50">Staked</span>
                      <span className="pixel-mono text-black/80">
                        {stakedAutoDisplay} AUTO
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {!hasSession && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="pixel-sans text-sm text-amber-950">
                {syncing
                  ? "Signing in to load credits and API keys..."
                  : syncError ?? "Preparing your account..."}
              </p>
              {syncError && !syncing && (
                <button
                  type="button"
                  onClick={() => void syncSession()}
                  className="pixel-sans mt-4 rounded-xl border border-amber-300 bg-white px-6 py-3 text-sm text-black hover:bg-amber-100"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {error && hasSession && (
            <div className="pixel-sans rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {hasSession && (
            <>
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="pixel-serif text-lg text-black">Credits</h2>
                  <Link to="/" className="pixel-sans text-sm text-emerald-700">
                    Buy more
                  </Link>
                </div>

                {loading && data.computeBalances.length === 0 && (
                  <p className="pixel-sans text-sm text-black/50">
                    Loading credits...
                  </p>
                )}

                {data.computeBalances.length === 0 && !loading ? (
                  <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center">
                    <p className="pixel-sans text-black/50">No credits yet</p>
                    <Link
                      to="/"
                      className="pixel-sans mt-3 inline-block text-sm text-emerald-700"
                    >
                      Buy credits →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.computeBalances.map((balance) => (
                      <div
                        key={balance.id}
                        className={`flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] px-4 py-4 ${
                          highlightTier === balance.modelTier
                            ? "ring-1 ring-emerald-500/40"
                            : ""
                        }`}
                      >
                        <div>
                          <div className="pixel-sans text-black">
                            {contractLabel(balance.modelTier, balance.modelTier)}
                          </div>
                          <div className="pixel-sans mt-0.5 text-xs text-black/45">
                            Until{" "}
                            {new Date(balance.expiryDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="pixel-serif text-lg text-emerald-700">
                            {formatTokens(balance.tokenBalanceRemaining)}
                          </div>
                          <div className="pixel-sans text-xs text-black/45">
                            {balance.isExpired ? "Expired" : "Active"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="pixel-serif mb-4 text-lg text-black">API keys</h2>

                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={keyName}
                    onChange={(event) => setKeyName(event.target.value)}
                    placeholder="Name your key"
                    className="pixel-sans flex-1 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black placeholder:text-black/35 focus:border-black/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateKey()}
                    disabled={creatingKey || !keyName.trim()}
                    className="pixel-sans rounded-xl border border-black/15 bg-black/[0.04] px-5 py-3 text-sm text-black hover:bg-black/[0.08] disabled:opacity-40"
                  >
                    {creatingKey ? "..." : "Create"}
                  </button>
                </div>

                {createKeyError && (
                  <p className="pixel-sans mb-4 text-sm text-red-600">
                    {createKeyError}
                  </p>
                )}

                {newKey && (
                  <div className="pixel-sans mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-900">
                      Copy now — shown once
                    </p>
                    <code className="pixel-mono mt-2 block break-all text-xs text-black/80">
                      {newKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => setNewKey(null)}
                      className="mt-3 text-xs text-black/45 hover:text-black"
                    >
                      Done
                    </button>
                  </div>
                )}

                {data.apiKeys.length === 0 && !loading && (
                  <p className="pixel-sans text-sm text-black/50">
                    No keys yet. Create one to use your credits.
                  </p>
                )}

                <div className="space-y-2">
                  {data.apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3"
                    >
                      <span className="pixel-sans text-sm text-black">
                        {key.name}
                      </span>
                      <span className="pixel-mono text-xs text-black/45">
                        {key.key_prefix}···
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-5">
                <h2 className="pixel-serif mb-3 text-lg text-black">API URL</h2>
                <div className="flex gap-2">
                  <code className="pixel-mono min-w-0 flex-1 overflow-x-auto rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-emerald-800">
                    {gatewayUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyGateway()}
                    className="pixel-sans shrink-0 rounded-lg border border-black/15 px-3 text-sm text-black hover:bg-black/5"
                  >
                    {copiedGateway ? "Copied" : "Copy"}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <SuccessOverlay
        open={showKeyCreated}
        title="API key created"
        message="Copy it now — it's shown only once."
        onDone={() => setShowKeyCreated(false)}
      />
    </>
  );
}

export function DashboardPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-black md:px-6">
      <h1 className="pixel-serif mb-2 text-3xl text-black">Your account</h1>

      <DashboardErrorBoundary>
        <DashboardBody />
      </DashboardErrorBoundary>
    </main>
  );
}
