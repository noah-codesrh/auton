import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/economics";

const page = getDocPage("/economics")!;

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

export default function Economics() {
  return (
    <DocPage page={page}>
      <p>
        Auton sells the same thing as a GPU cloud or an inference API —
        tokens of model compute — but the <strong>economics</strong> underneath
        are different. Instead of renting capacity at an opaque, ever-changing
        spot price, Auton turns compute into a priced, tradable commodity with
        forward contracts, prepaid discounts, on-chain settlement, and a token
        whose scarcity is driven by real usage.
      </p>

      <h2 id="overview">Two ways to buy compute</h2>
      <p>
        Every AI builder pays for compute one of two ways today:
      </p>
      <ul>
        <li>
          <strong>Rent a GPU</strong> from a cloud (AWS, GCP, CoreWeave) — you
          pay by the hour whether or not you use it, and prices move with the
          market.
        </li>
        <li>
          <strong>Call an API</strong> (OpenAI, Anthropic, OpenRouter) — you pay
          per token at whatever rate the provider sets, postpaid, with a margin
          baked in that you never see.
        </li>
      </ul>
      <p>
        Both are <em>spot markets</em>: the price is set by the seller, can
        change at any time, and the money you spend accrues entirely to that
        company. Auton adds a third option — a market where compute is priced
        forward and value flows back to the people who use and secure the
        network.
      </p>

      <h2 id="legacy">How compute is priced today</h2>
      <ul>
        <li>
          <strong>Volatile &amp; opaque</strong> — rates can change overnight,
          and the markup over raw cost is hidden inside the sticker price.
        </li>
        <li>
          <strong>Postpaid &amp; unhedgeable</strong> — you find out the bill
          after you've spent it, and there's no way to lock next quarter's price
          for a model you depend on.
        </li>
        <li>
          <strong>Extractive</strong> — 100% of your spend becomes the
          provider's revenue. You are a tenant; you accrue none of the upside of
          the demand you create.
        </li>
        <li>
          <strong>Custodial</strong> — funds, capacity reservations, and trust
          all sit on the provider's books.
        </li>
      </ul>

      <h2 id="auton-model">The Auton model</h2>
      <ul>
        <li>
          <strong>Forward pricing</strong> — lock a per-model rate for a fixed
          term with <Link to="/markets">inference futures</Link>, or go long/short
          on compute prices in <Link to="/trading">trading</Link>. You can hedge
          volatility instead of absorbing it.
        </li>
        <li>
          <strong>Prepaid at a discount</strong> — <Link to="/chat">chat
          credits</Link> are metered per token but charged at{" "}
          <strong>~15% below the underlying market rate</strong> (a 0.85
          multiplier on spot). Paying through Auton is cheaper than going direct.
        </li>
        <li>
          <strong>On-chain settlement</strong> — payments and provider
          settlements clear in USDG on Robinhood Chain, verified on-chain. Reservations
          and balances are protocol state, not a vendor's private ledger.
        </li>
        <li>
          <strong>Usage-driven token sink</strong> — the demand you generate
          buys back and burns <Dollar />AUTO and rewards the stakers who secure
          capacity, so spend accrues to the network rather than a single
          company.
        </li>
      </ul>

      <h2 id="comparison">Side by side</h2>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Traditional providers</th>
            <th>Auton</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Pricing</strong>
            </td>
            <td>Spot, set by seller, changes anytime</td>
            <td>Forward rates you can lock, plus discounted prepaid credits</td>
          </tr>
          <tr>
            <td>
              <strong>Billing</strong>
            </td>
            <td>Postpaid — bill after the fact</td>
            <td>Prepaid balance, metered per token, ~15% under spot</td>
          </tr>
          <tr>
            <td>
              <strong>Price risk</strong>
            </td>
            <td>You absorb all volatility</td>
            <td>Hedge or speculate with futures &amp; leverage</td>
          </tr>
          <tr>
            <td>
              <strong>Settlement</strong>
            </td>
            <td>Off-chain, custodial, trust the invoice</td>
            <td>On-chain in USDG, verifiable</td>
          </tr>
          <tr>
            <td>
              <strong>Where value goes</strong>
            </td>
            <td>100% to provider equity</td>
            <td>
              Buyback &amp; burn <Dollar />AUTO + staker rewards
            </td>
          </tr>
          <tr>
            <td>
              <strong>Capacity guarantee</strong>
            </td>
            <td>Best-effort, provider's terms</td>
            <td>
              Backed by staked <Dollar />AUTO with slashing for SLA breaches
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="flow">How value flows</h2>
      <p>
        A single payment moves through the protocol like this — and the last
        step loops back, tightening <Dollar />AUTO supply as usage grows:
      </p>

      <div className="mx-auto my-8 max-w-md">
        <FlowNode tag="You" title="Pay once">
          Deposit <Dollar />AUTO or USDG
        </FlowNode>
        <FlowArrow />
        <FlowNode tag="Auton protocol" title="Lock a rate or prepay credits">
          Forward contract to hedge, or pay-as-you-go credits at ~15% under spot
        </FlowNode>
        <FlowArrow label="OpenAI-compatible request" />
        <FlowNode tag="Inference gateway" title="Route &amp; meter">
          Proxies your call to the right model and meters tokens used
        </FlowNode>
        <FlowArrow />
        <FlowNode tag="Compute providers" title="Run the model">
          Models execute; usage is settled in USDG
        </FlowNode>
        <FlowArrow label="Settlement fees" />
        <FlowNode tag="Treasury" title="Collect revenue" />
        <FlowArrow label="Split" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FlowNode title="Buyback &amp; burn">
            Treasury buys <Dollar />AUTO and burns it — supply shrinks
          </FlowNode>
          <FlowNode title="Staker rewards">
            Verifiers who secure capacity earn USDG
          </FlowNode>
        </div>
        <FlowArrow label="Value loops back" />
        <FlowNode highlight title="Scarcer $AUTO, more secured capacity">
          Real usage → less supply + stronger SLAs → value accrues to holders
          and the network, not one company
        </FlowNode>
      </div>

      <h2 id="token-sink">Why demand accrues to $AUTO</h2>
      <p>
        In a normal API business, more usage simply means more revenue for the
        provider's shareholders. On Auton, more usage tightens the{" "}
        <Dollar />AUTO supply and deepens the security pool:
      </p>
      <ul>
        <li>
          Futures positions <strong>lock</strong> <Dollar />AUTO as margin —
          more builders hedging means more <Dollar />AUTO held off-market.
        </li>
        <li>
          Settlement fees fund a <strong>buyback &amp; burn</strong>: <Dollar />
          AUTO paid for chat is burned directly, and USDG revenue is used to buy{" "}
          <Dollar />AUTO and burn it.
        </li>
        <li>
          Providers <strong>stake</strong> <Dollar />AUTO to back their SLA and
          earn a share of every settlement, so capacity growth locks supply too.
        </li>
      </ul>
      <p>
        The result is a token whose scarcity is tied to genuine compute
        demand rather than speculation. See <Link to="/auto-token">The $AUTO
        Token</Link> for the mechanics and the{" "}
        <a
          href="https://www.autonairh.xyz/treasury"
          target="_blank"
          rel="noopener noreferrer"
        >
          treasury page
        </a>{" "}
        for live burn and stake totals.
      </p>

      <h2 id="takeaway">What it means for you</h2>
      <ul>
        <li>
          <strong>Builders</strong> — pay less per token than going direct, and
          lock prices so a budget set today survives a market spike tomorrow.
        </li>
        <li>
          <strong>Providers</strong> — monetize spare capacity with on-chain
          USDG settlements and boosted payouts for staking.
        </li>
        <li>
          <strong>Token holders</strong> — every unit of real inference demand
          flows back into <Dollar />AUTO scarcity and network security.
        </li>
      </ul>
    </DocPage>
  );
}
