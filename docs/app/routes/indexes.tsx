import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/indexes";

const page = getDocPage("/indexes")!;

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

/** A small weighted-basket sketch: constituents summing into one index line. */
function IndexSketch() {
  const bars = [
    { x: 40, h: 54 },
    { x: 78, h: 34 },
    { x: 116, h: 70 },
    { x: 154, h: 46 },
    { x: 192, h: 60 },
  ];
  return (
    <svg
      viewBox="0 0 320 160"
      className="mx-auto my-6 w-full max-w-md"
      role="img"
      aria-label="Weighted constituents combine into a single index line"
    >
      <line x1="24" y1="120" x2="300" y2="120" stroke="#d1d5db" strokeWidth="1" />
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={120 - b.h}
          width="22"
          height={b.h}
          fill="#4f7299"
          fillOpacity={0.18}
          stroke="#4f7299"
          strokeWidth="1"
        />
      ))}
      <polyline
        points="51,66 89,86 127,50 165,74 203,60 260,40"
        fill="none"
        stroke="#4f7299"
        strokeWidth="2"
      />
      <circle cx="260" cy="40" r="3.5" fill="#4f7299" />
      <text x="286" y="44" fontSize="9" fill="#4f7299" textAnchor="end">
        index
      </text>
      <text x="150" y="150" fontSize="9" fill="#9ca3af" textAnchor="middle">
        weighted constituents →
      </text>
    </svg>
  );
}

export default function Indexes() {
  return (
    <DocPage page={page}>
      <p>
        <strong>Layer 5 is the benchmark layer.</strong> Layers 2–4 built a market
        (futures), a term structure (the{" "}
        <Link to="/yield-curve">yield curve</Link>), and a{" "}
        <Link to="/derivatives">derivatives</Link> surface. Layer 5 turns all of
        that activity into <strong>indexes</strong> — single numbers that tell you
        how the whole machine economy is doing.
      </p>
      <p>
        The market needed pricing data. Now it needs benchmarks: the way the S&amp;P
        500 summarizes equities and the CPI summarizes consumer prices, Auton's
        indexes summarize AI compute.
      </p>

      <h2 id="overview">The benchmark layer</h2>
      <p>
        An index is a weighted summary of many prices. Because Auton already runs
        a futures market with live marks for every model family, an index is just
        a pure function of those marks and a set of weights — no new data source
        required. That means every index below is <strong>live</strong> and its
        history lines up tick-for-tick with the trading terminal.
      </p>

      <IndexSketch />

      <h2 id="indexes">The three indexes</h2>
      <ul>
        <li>
          <strong>INF100 — the S&amp;P 500 of AI compute.</strong> A
          volume-weighted index of the inference market. Each model family
          (DeepSeek, Llama, Qwen, GPT, Gemini, Claude, Mistral) carries weight in
          proportion to its contract volume, so INF100 is a single read on how
          inference pricing is moving as a whole. Based at 1,000.
        </li>
        <li>
          <strong>GPU500 — supply health of the machine economy.</strong> Tracks
          global GPU supply across decentralized networks — Akash, io.net, Render,
          Filecoin, Aethir, Nosana. It moves inversely to clearing price: when
          compute clears cheaper, more supply is online and the index rises. Based
          at 500.
        </li>
        <li>
          <strong>AGENT CPI — the inflation index of the autonomous economy.</strong>{" "}
          The total cost of running a standard autonomous agent: a fixed basket of
          compute + storage + bandwidth + data access. If it rises, running agents
          is getting more expensive; if it falls, the machine economy is getting
          more efficient. Based at 100, CPI-style.
        </li>
      </ul>

      <h2 id="calculation">How they're calculated</h2>
      <p>
        Each index is calibrated to a base level at inception, then tracked
        relative to a baseline basket:
      </p>
      <ul>
        <li>
          <strong>INF100</strong> = 1,000 × (weighted live price ÷ weighted
          baseline price), where weights are each family's share of volume.
        </li>
        <li>
          <strong>GPU500</strong> = 500 × (baseline ÷ live)<sup>e</sup>, a supply
          proxy with elasticity <em>e</em> — cheaper clearing compute implies more
          capacity online.
        </li>
        <li>
          <strong>AGENT CPI</strong> = 100 × (basket cost now ÷ basket cost at
          baseline). The compute leg is priced live off inference; storage,
          bandwidth, and data access are modeled unit prices.
        </li>
      </ul>
      <p>
        The historical line for each index is <em>reconstructed</em> from the
        price engine's minute candles: the same weights are applied at every past
        timestamp, so the chart is a faithful replay rather than a stored guess.
      </p>

      <h2 id="architecture">Architecture</h2>
      <p>
        The index engine sits on top of the same market data everything else uses.
        It reads the curve and the live marks, applies weights, and serves three
        index series:
      </p>

      <div className="mx-auto my-8 max-w-md">
        <FlowNode tag="Layers 2–3 · source" title="Futures market & curve">
          Per-family live marks + baseline forwards, from the price engine
        </FlowNode>
        <FlowArrow label="Marks + candle history" />
        <FlowNode tag="Weights & baskets" title="Index configuration">
          Volume weights, GPU network weights, the agent cost basket
        </FlowNode>
        <FlowArrow label="Weighted aggregation" />
        <FlowNode tag="Index engine" title="INF100 · GPU500 · AGENT CPI">
          Live levels + histories reconstructed from candles
        </FlowNode>
        <FlowArrow label="Serve" />
        <FlowNode tag="Indexes API" title="Levels, changes & constituents">
          One JSON payload per poll — levels, history, and breakdowns
        </FlowNode>
        <FlowArrow />
        <FlowNode highlight tag="Terminal" title="Index dashboard">
          Live tiles, historical charts, and constituent weights
        </FlowNode>
        <FlowArrow label="Eventually" />
        <FlowNode title="Tradeable indexes">
          Indexes become assets you can buy, hedge, and settle
        </FlowNode>
      </div>

      <h2 id="users">Who uses it</h2>
      <ul>
        <li>
          <strong>Traders</strong> — read INF100 for a one-glance view of the
          inference market instead of watching every family.
        </li>
        <li>
          <strong>Analysts</strong> — use AGENT CPI to answer whether the machine
          economy is inflating or deflating over time.
        </li>
        <li>
          <strong>Builders &amp; funds</strong> — benchmark their own compute costs
          and supply exposure against a neutral, on-chain reference.
        </li>
        <li>
          <strong>Third parties</strong> — build data terminals and products on
          top of Auton's index feeds.
        </li>
      </ul>

      <h2 id="auto">Why it matters for <Dollar />AUTO</h2>
      <p>
        Indexes are the point where Auton stops looking like an exchange and starts
        looking like <strong>market infrastructure</strong>. They are only possible
        because a real futures market, curve, and derivatives surface already
        exist beneath them — a data moat that compounds. As indexes become
        tradeable assets, every index future and option routes settlement flow
        through <Dollar />AUTO, the same way the VIX and index futures anchor
        equity markets.
      </p>

      <h2 id="status">Status</h2>
      <p>
        <strong>Layer 5 is live as read-only analytics.</strong> INF100, GPU500,
        and AGENT CPI are computed live from the futures market with historical
        charts and constituent breakdowns. GPU500 currently models supply from
        clearing prices; direct network feeds (Akash, io.net, Filecoin and others)
        are the next step, followed by making the indexes{" "}
        <strong>tradeable assets</strong> in their own right.
      </p>
    </DocPage>
  );
}
