import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useBackendSession } from "../hooks/use-backend-session";
import { detectWebGpu, useEarn } from "../hooks/use-earn";
import { getBackendApiUrl } from "../lib/api/providers";
import { LoginModal } from "./login-modal";

type OsTab = "macos" | "windows" | "linux";

const NODE_INSTALL: Record<OsTab, { label: string; command: string }> = {
  macos: { label: "macOS", command: "brew install node" },
  windows: { label: "Windows", command: "winget install OpenJS.NodeJS.LTS" },
  linux: { label: "Linux", command: "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs" },
};

function StatusDot({ tone }: { tone: "online" | "offline" | "idle" | "error" }) {
  const colors = {
    online: "bg-emerald-400",
    offline: "bg-amber-400",
    idle: "bg-black/20",
    error: "bg-red-400",
  };

  return (
    <span className={`inline-block h-2 w-2 rounded-full ${colors[tone]}`} />
  );
}

function NetworkDiagram({ count }: { count: number }) {
  const nodes = useMemo(() => {
    const visible = Math.min(count, 8);
    return Array.from({ length: visible }, (_, i) => ({
      id: i,
      x: 20 + (i % 4) * 22,
      y: i < 4 ? 18 : 42,
    }));
  }, [count]);

  return (
    <div className="relative mx-auto h-40 w-full max-w-xs">
      <svg viewBox="0 0 100 70" className="h-full w-full" aria-hidden>
        {nodes.map((node) => (
          <line
            key={`line-${node.id}`}
            x1="50"
            y1="58"
            x2={node.x}
            y2={node.y}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        ))}
        <rect x="38" y="52" width="24" height="12" rx="2" fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.15)" />
        <text x="50" y="60" textAnchor="middle" fill="rgba(0,0,0,0.45)" fontSize="4" fontFamily="monospace">
          ORCHESTRATOR
        </text>
        {nodes.map((node) => (
          <circle
            key={`node-${node.id}`}
            cx={node.x}
            cy={node.y}
            r="3"
            fill="rgba(128,160,193,0.35)"
            stroke="rgba(128,160,193,0.6)"
          />
        ))}
      </svg>
      {count > 8 && (
        <p className="pixel-sans absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-black/40">
          +{count - 8} more
        </p>
      )}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.03] px-3 py-4 text-center">
      <div className="pixel-serif text-xl text-black md:text-2xl">{value}</div>
      <div className="pixel-sans mt-1 text-[10px] uppercase tracking-wider text-black/40">
        {label}
      </div>
    </div>
  );
}

export function EarnPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [osTab, setOsTab] = useState<OsTab>("macos");
  const [webGpuReady, setWebGpuReady] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const { ready, authenticated, hasSession, syncing } = useBackendSession();
  const canUseBackend = authenticated && hasSession;

  const {
    network,
    status,
    loading,
    enrolling,
    enrollResult,
    error,
    enroll,
  } = useEarn(canUseBackend);

  useEffect(() => {
    void detectWebGpu().then(setWebGpuReady);
  }, []);

  const statusTone =
    status?.status === "online"
      ? "online"
      : status?.status === "offline"
        ? "offline"
        : "idle";

  const handleGetCommand = async () => {
    if (!canUseBackend) {
      setLoginOpen(true);
      return;
    }
    await enroll("native");
  };

  const commandText =
    enrollResult?.deployCommand ??
    (enrollResult?.token
      ? [
          `export AUTON_API_URL="${getBackendApiUrl()}"`,
          `export AUTON_WORKER_TOKEN="${enrollResult.token}"`,
          `curl -fsSL "${getBackendApiUrl()}/api/v1/providers/worker.mjs" | node`,
        ].join("\n")
      : null);

  const copyCommand = async () => {
    if (!commandText) return;
    await navigator.clipboard.writeText(commandText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="pixel-serif text-3xl text-black md:text-4xl">
              Worker Node
            </h1>
            <p className="pixel-sans mt-3 max-w-xl text-sm leading-relaxed text-black/60">
              Contribute GPU compute to the Auton network and earn USDG
              settlements from capacity commitments.
            </p>
          </div>

          <div className="pixel-sans text-right text-xs text-black/50">
            <div className="flex items-center justify-end gap-2">
              <StatusDot tone="online" />
              <span>Connected to orchestrator</span>
            </div>
            <p className="mt-1">
              {loading || !network
                ? "Loading network..."
                : `${network.workersOnline} workers online (${network.workersBrowser} browser · ${network.workersNative} native) · ${network.queueDepth} in queue`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/15 bg-black/[0.02] p-5 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="pixel-serif text-lg text-black">Status</h2>
              <StatusDot tone={statusTone} />
              <span className="pixel-sans text-xs capitalize text-black/50">
                {status?.status ?? "idle"}
              </span>
            </div>

            {!canUseBackend && ready && (
              <p className="pixel-sans mb-4 rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 text-xs text-black/50">
                {authenticated
                  ? syncing
                    ? "Connecting account..."
                    : "Sign in to track earnings and deploy your node."
                  : "Connect wallet to enroll a worker and earn USDG."}
              </p>
            )}

            {error && (
              <p className="pixel-sans mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricBox
                label="$USDG"
                value={status?.earningsUsdc ?? "0.00"}
              />
              <MetricBox
                label="Uptime"
                value={status?.status === "online" ? "Live" : "00:00:00"}
              />
              <MetricBox
                label="Jobs"
                value={String(status?.jobsCompleted ?? 0)}
              />
              <MetricBox label="tok/s" value="—" />
            </div>

            <p className="pixel-sans mt-4 text-xs text-black/35">
              ${status?.earningsUsdc ?? "0.00"} earned ·{" "}
              {status?.nodes.length ?? 0} node
              {(status?.nodes.length ?? 0) === 1 ? "" : "s"} registered
            </p>
          </section>

          <section className="rounded-2xl border border-black/15 bg-black/[0.02] p-5 md:p-6">
            <h2 className="pixel-serif mb-4 text-lg text-black">Network</h2>
            <NetworkDiagram count={network?.workersOnline ?? 0} />
          </section>
        </div>

        <section className="mt-10">
          <h2 className="pixel-serif text-2xl text-black md:text-3xl">
            Start earning
          </h2>
          <p className="pixel-sans mt-2 text-sm text-black/55">
            Two ways to contribute. Native runs in the background and pays up to
            10× more per job.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="relative rounded-2xl border border-[#80a0c1]/30 bg-[#80a0c1]/5 p-5 md:p-6">
              <span className="pixel-sans absolute top-4 right-4 rounded-md border border-[#80a0c1]/40 bg-[#80a0c1]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#80a0c1]">
                Recommended
              </span>

              <h3 className="pixel-serif text-xl text-black">
                ⚡ Native Worker
              </h3>
              <p className="pixel-sans mt-1 text-sm text-[#80a0c1]">
                $0.10–0.14 per job · Up to 10× browser earnings
              </p>

              <p className="pixel-sans mt-4 text-sm leading-relaxed text-black/60">
                Run the Auton provider node on your GPU in the background — no
                tab to keep open. Highest-paying jobs on the network.
              </p>

              <ol className="pixel-sans mt-4 list-decimal space-y-1 pl-4 text-sm text-black/55">
                <li>Click below to get your command</li>
                <li>Paste it into your terminal</li>
                <li>You&apos;re earning — it connects automatically</li>
              </ol>

              {commandText ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="pixel-sans text-xs text-amber-800/90">
                      {enrollResult?.warning ??
                        "Save this token — it won't be shown again."}
                    </p>
                  </div>
                  <pre className="pixel-sans overflow-x-auto rounded-xl border border-black/10 bg-black/[0.04] p-3 text-[11px] leading-relaxed text-black/80">
                    {commandText}
                  </pre>
                  <button
                    type="button"
                    onClick={() => void copyCommand()}
                    className="pixel-serif w-full rounded-xl border border-black/20 bg-black/[0.04] px-4 py-3 text-sm text-black transition-colors hover:border-black/35"
                  >
                    {copied ? "Copied!" : "Copy command"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={enrolling}
                  onClick={() => void handleGetCommand()}
                  className="pixel-serif mt-5 w-full rounded-xl border border-[#80a0c1]/50 bg-[#80a0c1] px-4 py-3.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {enrolling
                    ? "Generating..."
                    : canUseBackend
                      ? "Get my command"
                      : "Sign in to get command"}
                </button>
              )}

              <div className="mt-6 border-t border-black/10 pt-4">
                <p className="pixel-sans text-xs text-black/45">
                  Need Node.js 20+ first? Install it:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(NODE_INSTALL) as OsTab[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOsTab(key)}
                      className={`pixel-sans rounded-lg border px-3 py-1 text-xs transition-colors ${
                        osTab === key
                          ? "border-black/20 bg-black/5 text-black"
                          : "border-black/10 text-black/50 hover:text-black"
                      }`}
                    >
                      {NODE_INSTALL[key].label}
                    </button>
                  ))}
                </div>
                <pre className="pixel-sans mt-2 overflow-x-auto rounded-lg border border-black/10 bg-black/[0.04] px-3 py-2 text-[11px] text-black/70">
                  {NODE_INSTALL[osTab].command}
                </pre>
                <p className="pixel-sans mt-3 text-[11px] leading-relaxed text-black/35">
                  Needs a compatible GPU (NVIDIA, AMD, Apple Silicon). Token is
                  shown once — save it.{" "}
                  <Link to="/dashboard" className="text-[#80a0c1] hover:underline">
                    Manage keys
                  </Link>
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-black/15 bg-black/[0.02] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="pixel-serif text-xl text-black">
                  Browser Worker
                </h3>
                <span className="pixel-sans text-sm text-black/50">$0.07/job</span>
              </div>

              <p className="pixel-sans mt-4 text-sm leading-relaxed text-black/60">
                Run inference in this tab using WebGPU. Easiest to start, but
                earns less than native — and only while the tab stays open.
              </p>

              <div className="mt-4">
                {webGpuReady === null ? (
                  <span className="pixel-sans inline-flex rounded-md border border-black/15 px-2 py-1 text-xs text-black/40">
                    Checking WebGPU...
                  </span>
                ) : webGpuReady ? (
                  <span className="pixel-sans inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                    WebGPU ready
                  </span>
                ) : (
                  <span className="pixel-sans inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
                    WebGPU unavailable
                  </span>
                )}
              </div>

              <p className="pixel-sans mt-6 text-xs text-black/40">
                Browser worker inference is coming soon. Use the native worker
                today for live payouts.
              </p>

              <button
                type="button"
                disabled
                className="pixel-serif mt-4 w-full rounded-xl border border-black/15 px-4 py-3.5 text-sm text-black/40"
              >
                Coming soon
              </button>
            </article>
          </div>
        </section>
      </main>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
