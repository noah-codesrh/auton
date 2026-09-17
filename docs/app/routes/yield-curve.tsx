import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/yield-curve";

const page = getDocPage("/yield-curve")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

function Dollar() {
  return <span className="dollar">$</span>;
}

function FlowNode({
  tag,
  title,
  children,
  highlight,
}: {
  tag?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-center ${
        highlight
          ? "border-[var(--color-docs-accent)]/40 bg-[var(--color-docs-accent)]/[0.07]"
          : "border-black/[0.12] bg-black/[0.02]"
      }`}
    >
      {tag ? (
        <div className="pixel-sans text-[11px] uppercase tracking-wider text-black/40">
          {tag}
        </div>
      ) : null}
      <div className="pixel-serif text-sm text-black md:text-base">{title}</div>
      {children ? (
        <div className="pixel-sans mt-1 text-xs leading-snug text-black/55">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1.5 text-[var(--color-docs-accent)]">
      {label ? (
        <span className="pixel-sans mb-0.5 text-[11px] uppercase tracking-wider text-black/40">
          {label}
        </span>
      ) : null}
      <span aria-hidden className="text-lg leading-none">
        ↓
      </span>
    </div>
  );
}

/** A small, illustrative yield-curve sketch (contango vs. backwardation). */
function CurveSketch() {
  return (
    <svg
      viewBox="0 0 320 160"
      className="mx-auto my-6 w-full max-w-md"
      role="img"
      aria-label="Illustrative yield curves: contango sloping up, backwardation sloping down"
    >
      {/* axes */}
      <line x1="36" y1="12" x2="36" y2="132" stroke="#d1d5db" strokeWidth="1" />
      <line x1="36" y1="132" x2="308" y2="132" stroke="#d1d5db" strokeWidth="1" />
      {/* contango (up) */}
      <polyline
        points="36,108 104,96 172,78 240,60 300,46"
        fill="none"
        stroke="#4f7299"
        strokeWidth="2"
      />
      {/* backwardation (down) */}
      <polyline
        points="36,64 104,76 172,90 240,104 300,116"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      {/* labels */}
      <text x="304" y="42" fontSize="9" fill="#4f7299" textAnchor="end">
        contango
      </text>
      <text x="304" y="128" fontSize="9" fill="#6b7280" textAnchor="end">
        backwardation
      </text>
      <text
        x="20"
        y="74"
        fontSize="8"
        fill="#9ca3af"
        textAnchor="middle"
        transform="rotate(-90 20 74)"
      >
        $/M tokens
      </text>
      <text x="172" y="150" fontSize="8" fill="#9ca3af" textAnchor="middle">
        time to expiry →
      </text>
    </svg>
  );
}

export default function YieldCurve() {
  return (
    <DocPage page={page}>
      <p>
        <strong>Layer 3 is the intelligence layer.</strong> It sits on top of the{" "}
        <Link to="/trading">futures market</Link> and turns thousands of
        individual locked-rate contracts into a single, continuous picture:{" "}
        <strong>a yield curve for AI compute</strong> — what the market believes
        inference will cost at every point in the future.
      </p>
      <p>
        This is data nobody else has, because nobody else has the futures market
        underneath it. <em>You own the curve because you built the market.</em>
      </p>

      <h2 id="overview">The intelligence layer</h2>
      <p>
        On <Link to="/markets">Layer 2</Link>, every action a user takes produces
        a price point. Someone locks DeepSeek at <Dollar />
        0.14/M until September. Someone else locks it at <Dollar />0.16/M until
        December. Another at <Dollar />0.19/M until March. Each contract is one
        coordinate.
      </p>
      <p>
        Individually those are just trades. Plotted together — price per million
        tokens against time to expiry — they form a <strong>term structure</strong>:
        the same yield curve that defines every mature commodity and rates market,
        now for machine compute.
      </p>

      <h2 id="curve">What the yield curve is</h2>
      <p>
        The yield curve maps the price of compute across a series of future expiry
        dates. On Auton, each model gets its own curve:
      </p>
      <ul>
        <li>
          <strong>X-axis</strong> — time to expiry (1 week, 1 month, 3 months, 6
          months, and beyond).
        </li>
        <li>
          <strong>Y-axis</strong> — locked rate in <Dollar />/M tokens implied by
          the futures at that expiry.
        </li>
        <li>
          <strong>One curve per model</strong> — DeepSeek, Llama, Qwen, GPT,
          Gemini, Claude — so you can compare term structures across providers.
        </li>
      </ul>

      <CurveSketch />

      <h2 id="forms">How the curve forms</h2>
      <p>
        The curve is built directly from real market activity, not a model's list
        price:
      </p>
      <ul>
        <li>
          Each open and settled futures contract contributes a{" "}
          <strong>(expiry, rate)</strong> point for its model.
        </li>
        <li>
          Points are grouped by model and sorted along the expiry axis to form
          the term structure.
        </li>
        <li>
          The front of the curve is anchored to the <strong>live spot rate</strong>{" "}
          (the blended price the gateway pays today), so the near end always
          reflects reality.
        </li>
        <li>
          As more contracts open across more expiries, the curve gets denser and
          more accurate — it improves automatically with volume.
        </li>
      </ul>

      <h2 id="reading">Reading the curve</h2>
      <p>The shape of the curve is itself the signal:</p>
      <table>
        <thead>
          <tr>
            <th>Shape</th>
            <th>What it means</th>
            <th>Signal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Contango</strong> (sloping up)
            </td>
            <td>Future compute is priced higher than today</td>
            <td>Market expects scarcity, demand growth, or a model launch</td>
          </tr>
          <tr>
            <td>
              <strong>Backwardation</strong> (sloping down)
            </td>
            <td>Future compute is priced lower than today</td>
            <td>Market expects new supply / efficiency to drive prices down</td>
          </tr>
          <tr>
            <td>
              <strong>Local spike</strong>
            </td>
            <td>A bump around a specific expiry</td>
            <td>An anticipated event — e.g. a major model drop that period</td>
          </tr>
        </tbody>
      </table>

      <h2 id="architecture">Architecture</h2>
      <p>
        The curve is a read-only data layer derived from Layer 2. Nothing new is
        traded here — it indexes the market that already exists and serves it back
        as financial-grade analytics:
      </p>

      <div className="mx-auto my-8 max-w-md">
        <FlowNode tag="Layer 2 · source" title="Futures market">
          Contracts opened &amp; settled across expiries (1w · 1m · 3m · 6m) — each
          one a price point
        </FlowNode>
        <FlowArrow label="On-chain settlement + locked rates" />
        <FlowNode tag="Indexer" title="Collect data points">
          Aggregates every contract into <Dollar />/M rates tagged by model and
          expiry
        </FlowNode>
        <FlowArrow label="Group by model, sort by expiry" />
        <FlowNode tag="Curve engine" title="Build the term structure">
          Assembles per-model curves and anchors the front to the live spot rate
        </FlowNode>
        <FlowArrow label="Serve" />
        <FlowNode tag="Yield-curve API" title="Per-model curve endpoints">
          Time-series of expiry → rate, plus derived metrics (slope,
          contango/backwardation, spreads)
        </FlowNode>
        <FlowArrow />
        <FlowNode highlight tag="Terminal" title="Real-time curve dashboard">
          Clean financial charting — expiry on X, <Dollar />/M on Y, one curve per
          model
        </FlowNode>
        <FlowArrow label="Consumed by" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FlowNode title="Builders">Time when to lock futures</FlowNode>
          <FlowNode title="Traders">Spot curve arbitrage</FlowNode>
          <FlowNode title="Analysts">Read market direction</FlowNode>
        </div>
      </div>

      <h2 id="users">Who uses it</h2>
      <ul>
        <li>
          <strong>Builders</strong> — decide <em>when</em> to lock in futures. If
          the curve is in contango, lock now; if it's in backwardation, wait.
        </li>
        <li>
          <strong>Traders</strong> — spot mispricings between expiries or between
          the curve and live spot, and express them with{" "}
          <Link to="/trading">leveraged positions</Link>.
        </li>
        <li>
          <strong>Analysts</strong> — track where the compute market is heading
          across models, the way rates desks read a yield curve.
        </li>
      </ul>

      <h2 id="auto">Why it matters for $AUTO</h2>
      <p>
        This is the moment Auton stops looking like a crypto product and starts
        looking like a <strong>Bloomberg Terminal for machine resources</strong>.
        The yield curve is pure data infrastructure — and it is defensible
        precisely because it can only exist on top of a real futures market:
      </p>
      <ul>
        <li>
          The curve is a <strong>data moat</strong>: no market underneath means no
          curve, and Auton owns the market.
        </li>
        <li>
          More usage on Layer 2 → a richer curve → more builders, traders, and
          analysts → more usage. The intelligence layer compounds demand for the{" "}
          <Link to="/economics">underlying market</Link> that drives{" "}
          <Dollar />AUTO.
        </li>
        <li>
          It positions <Dollar />AUTO as the settlement and data layer of the
          machine-resource economy, not just another token.
        </li>
      </ul>

      <h2 id="status">Status</h2>
      <p>
        The yield curve is the planned <strong>Layer 3</strong>. The data that
        feeds it — locked rates, expiries, and on-chain settlements — is already
        being produced by the live Layer 2 futures market today. This page
        describes the design; the terminal dashboard is the next build, and it
        grows more valuable with every contract opened in the meantime.
      </p>
    </DocPage>
  );
}
