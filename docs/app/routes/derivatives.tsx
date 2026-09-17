import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/derivatives";

const page = getDocPage("/derivatives")!;

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

/** A small long-call payoff sketch (premium paid, break-even, upside). */
function PayoffSketch() {
  return (
    <svg
      viewBox="0 0 320 160"
      className="mx-auto my-6 w-full max-w-md"
      role="img"
      aria-label="Long call payoff: flat loss of the premium below the strike, rising profit above break-even"
    >
      {/* zero line */}
      <line x1="24" y1="112" x2="308" y2="112" stroke="#d1d5db" strokeWidth="1" />
      {/* strike marker */}
      <line x1="150" y1="20" x2="150" y2="132" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" />
      {/* payoff: flat (premium loss) then rising */}
      <polyline
        points="24,128 150,128 300,40"
        fill="none"
        stroke="#4f7299"
        strokeWidth="2"
      />
      <text x="150" y="150" fontSize="9" fill="#6b7280" textAnchor="middle">
        strike
      </text>
      <text x="40" y="140" fontSize="9" fill="#9ca3af">
        −premium
      </text>
      <text x="292" y="34" fontSize="9" fill="#4f7299" textAnchor="end">
        upside
      </text>
      <text x="14" y="74" fontSize="8" fill="#9ca3af" textAnchor="middle" transform="rotate(-90 14 74)">
        P/L
      </text>
      <text x="300" y="126" fontSize="8" fill="#9ca3af" textAnchor="end">
        forward at expiry →
      </text>
    </svg>
  );
}

export default function Derivatives() {
  return (
    <DocPage page={page}>
      <p>
        <strong>Layer 4 is the derivatives layer.</strong> It sits on top of the{" "}
        <Link to="/yield-curve">yield curve</Link> and turns each forward point
        into a full options surface: <strong>calls and puts</strong> on the price
        of AI compute, with live Greeks, calendar spreads, and a volatility index.
      </p>
      <p>
        Where Layer 2 lets you <em>lock</em> a rate and Layer 3 shows you{" "}
        <em>where the market thinks rates are going</em>, Layer 4 lets you price
        and express a view on <em>uncertainty itself</em> — the volatility of
        machine compute.
      </p>

      <h2 id="overview">The derivatives layer</h2>
      <p>
        Every model family already has a forward curve — a series of{" "}
        <strong>(expiry, rate)</strong> points from the futures market. An option
        is a contract on one of those forwards: the right, but not the
        obligation, to transact compute at a fixed <Dollar />/M{" "}
        <strong>strike</strong> by a given expiry. From a single forward we
        generate an entire board of strikes, and from the whole curve we generate
        a board per expiry.
      </p>

      <h2 id="products">What you can trade</h2>
      <ul>
        <li>
          <strong>Calls &amp; puts</strong> — across a ladder of strikes around
          each forward, for every model family (DeepSeek, Llama, Qwen, GPT,
          Gemini, Claude).
        </li>
        <li>
          <strong>Downside protection (puts)</strong> — builders buy puts to cap
          their exposure to sudden API-cost spikes, paying a known premium instead
          of absorbing open-ended risk.
        </li>
        <li>
          <strong>Volatility trades</strong> — speculators trade the pure
          volatility of a family (e.g. a straddle) without taking a directional
          view on the underlying capacity contract.
        </li>
        <li>
          <strong>Calendar spreads</strong> — market makers capture the difference
          between the same strike across two expiry months as the term structure
          of volatility shifts.
        </li>
      </ul>

      <PayoffSketch />

      <h2 id="pricing">How options are priced</h2>
      <p>
        Because the underlying is a <em>forward</em>, options are priced with the{" "}
        <strong>Black-76</strong> model (the forward-based form of
        Black-Scholes). Each contract is priced from five inputs:
      </p>
      <ul>
        <li>
          <strong>Forward (F)</strong> — the yield-curve rate at that expiry, in{" "}
          <Dollar />/M tokens.
        </li>
        <li>
          <strong>Strike (K)</strong> — the fixed rate the option locks, taken
          from a ladder around the forward.
        </li>
        <li>
          <strong>Time (T)</strong> — years to expiry.
        </li>
        <li>
          <strong>Volatility (σ)</strong> — the family's annualized compute vol,
          adjusted per strike by a skew so downside puts price richer.
        </li>
        <li>
          <strong>Rate (r)</strong> — a risk-free rate used to discount the
          premium to today.
        </li>
      </ul>
      <p>
        The result is a premium in <Dollar />/M tokens for every call and put on
        the board, along with an implied-volatility smile across strikes. The
        forward is anchored to the <strong>live futures mark</strong> and the vol
        level breathes with the underlying's recent realized moves, so premia and
        Greeks update with the market rather than sitting on static assumptions.
      </p>

      <h2 id="buying">Buying &amp; settlement</h2>
      <p>
        You can <strong>buy any call or put straight from the chain</strong>. Pick
        a strike, choose a size in millions of tokens, and the premium is debited
        from your unified <Link to="/economics">USD credit balance</Link> — the
        same wallet that powers chat. A call gives you the right to compute at
        today's price into the future: if the rate spikes above your break-even
        you profit, and if it doesn't the most you can lose is the premium.
      </p>
      <ul>
        <li>
          <strong>Live positions</strong> — every open position is
          marked-to-market against the same Black-76 surface, showing current
          value, P/L, and whether it's in the money.
        </li>
        <li>
          <strong>Close any time</strong> — sell the option back at its current
          premium to realize gains or cut losses before expiry; proceeds are
          credited straight back to your balance.
        </li>
        <li>
          <strong>Expiry settlement</strong> — at expiry a position settles
          automatically at its intrinsic value (how far in the money it finished)
          against the live underlying. Out-of-the-money options expire worthless,
          costing only the premium already paid.
        </li>
      </ul>

      <h2 id="greeks">Reading the Greeks</h2>
      <p>The Greeks describe how a premium reacts to the market:</p>
      <table>
        <thead>
          <tr>
            <th>Greek</th>
            <th>Measures</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Delta</strong>
            </td>
            <td>Sensitivity to the forward moving <Dollar />1/M</td>
            <td>Directional exposure &amp; hedge ratio</td>
          </tr>
          <tr>
            <td>
              <strong>Gamma</strong>
            </td>
            <td>How fast delta itself changes</td>
            <td>Stability of a hedge</td>
          </tr>
          <tr>
            <td>
              <strong>Vega</strong>
            </td>
            <td>Sensitivity to a +1% change in volatility</td>
            <td>Exposure to vol, not direction</td>
          </tr>
          <tr>
            <td>
              <strong>Theta</strong>
            </td>
            <td>One day of time decay</td>
            <td>Cost of holding a long option</td>
          </tr>
        </tbody>
      </table>

      <h2 id="vol">The volatility index</h2>
      <p>
        Each family's front-board at-the-money volatility becomes a{" "}
        <strong>vol index</strong> — a "compute VIX" that measures how uncertain
        the market is about that model's near-term pricing. Averaged across
        families, it gives a single read on the volatility of the whole machine-
        compute economy. A rising index means the market expects bigger price
        swings — from a model launch, a price war, or a supply shock.
      </p>

      <h2 id="architecture">Architecture</h2>
      <p>
        The options surface is derived from the market below it: it prices the
        forwards that already exist and serves them as an options desk would.
        Buying, marking, and settlement run against that same surface, with
        premiums and payouts flowing through your USD credit balance (a paper
        desk — no on-chain settlement yet):
      </p>

      <div className="mx-auto my-8 max-w-md">
        <FlowNode tag="Layer 3 · source" title="Yield curve">
          Per-model forward points — <Dollar />/M rate at each expiry
        </FlowNode>
        <FlowArrow label="Forward F per expiry" />
        <FlowNode tag="Vol surface" title="Volatility assumptions">
          Per-family annualized vol + a put skew across strikes
        </FlowNode>
        <FlowArrow label="F, K, T, σ, r" />
        <FlowNode tag="Pricing engine" title="Black-76 + Greeks">
          Prices calls &amp; puts across a strike ladder; computes delta, gamma,
          vega, theta
        </FlowNode>
        <FlowArrow label="Serve" />
        <FlowNode tag="Derivatives API" title="Option boards & spreads">
          Chains per expiry, calendar spreads, and vol indices
        </FlowNode>
        <FlowArrow />
        <FlowNode tag="Terminal" title="Options chain & smile">
          Calls / strike / puts, an IV smile, and a per-model vol index
        </FlowNode>
        <FlowArrow label="Buy from chain" />
        <FlowNode highlight tag="Positions" title="Buy · mark · settle">
          Premium debits credits; positions mark live and settle at expiry
        </FlowNode>
        <FlowArrow label="Consumed by" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FlowNode title="Builders">Hedge cost spikes</FlowNode>
          <FlowNode title="Speculators">Trade volatility</FlowNode>
          <FlowNode title="Market makers">Work the spreads</FlowNode>
        </div>
      </div>

      <h2 id="users">Who uses it</h2>
      <ul>
        <li>
          <strong>Builders</strong> — buy puts to cap downside on their inference
          bill, converting open-ended cost risk into a known premium.
        </li>
        <li>
          <strong>Speculators</strong> — trade the volatility of a family directly
          with straddles and strangles, independent of direction.
        </li>
        <li>
          <strong>Market makers</strong> — earn the spread between expiries and
          strikes, providing liquidity to the surface.
        </li>
      </ul>

      <h2 id="auto">Why it matters for $AUTO</h2>
      <p>
        Derivatives turn Auton from a market into a{" "}
        <strong>multi-dimensional financial venue</strong>. The same data moat
        that powers the curve powers the options surface — and it compounds:
      </p>
      <ul>
        <li>
          Options only exist because a real futures market and curve sit beneath
          them. Auton owns that stack end to end.
        </li>
        <li>
          More expiries and usage on Layers 2–3 → a richer surface → more hedgers,
          speculators, and market makers → more settlement flow through{" "}
          <Dollar />AUTO.
        </li>
        <li>
          A volatility index positions <Dollar />AUTO at the center of{" "}
          <Link to="/economics">the machine-compute economy</Link> — the way the
          VIX anchors equity markets.
        </li>
      </ul>

      <h2 id="status">Status</h2>
      <p>
        <strong>Layer 4 is live.</strong> The pricing engine, Greeks, volatility
        surface, and calendar spreads run on the yield curve, and you can{" "}
        <strong>buy calls and puts</strong> from the chain — paying premium from
        your credit balance, marking positions live, closing early, and settling
        automatically at expiry.
      </p>
      <p>
        This is a paper desk today: premiums and payouts move through USD credits,
        with the venue as counterparty. The next phase adds the{" "}
        <strong>writer side</strong> — sellers posting <Dollar />AUTO / USDG
        collateral to earn premium (an <Dollar />AUTO sink) — and on-chain option
        contracts with margined settlement.
      </p>
    </DocPage>
  );
}
