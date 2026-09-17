import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/why-auton-matters";

const page = getDocPage("/why-auton-matters")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function WhyAutonMatters() {
  return (
    <DocPage page={page}>
      <p>
        GPU and inference pricing swings week to week. AI teams budget on spot
        rates that move against them. Providers can't commit capacity without
        collateral. Auton exists to fix both sides of that market.
      </p>

      <h2 id="the-problem">The problem</h2>
      <p>
        Decentralized compute networks offer raw capacity, but consumers still
        face spot volatility, no price certainty, and no way to hedge. Builders
        overpay when demand spikes. Providers go offline without consequence.
        Liquidity sits idle because there's no derivatives layer to absorb risk.
      </p>

      <h2 id="the-solution">The solution</h2>
      <p>
        Auton introduces forward contracts and capacity commitments — the same
        primitives that exist in commodity markets, applied to compute. Lock a
        rate today. Reserve GPU hours for Q3. Stake{" "}
        <span className="dollar">$</span>AUTO as margin or SLA collateral. Trade
        on-chain with no intermediaries.
      </p>
      <ul>
        <li>
          <strong>Hedge volatility</strong> — futures lock inference rates
          months ahead
        </li>
        <li>
          <strong>Guarantee capacity</strong> — commitment contracts reserve
          decentralized GPU hours
        </li>
        <li>
          <strong>Earn yield</strong> — provide liquidity and collect fees in
          USDG
        </li>
      </ul>

      <h2 id="who-its-for">Who it's for</h2>
      <p>
        <strong>AI builders</strong> who need predictable inference costs and
        reliable GPU access. <strong>Compute providers</strong> who want to earn
        USDG settlements and boost payouts by staking.{" "}
        <strong>Liquidity participants</strong> who trade compute derivatives
        directly from their wallet.
      </p>
    </DocPage>
  );
}
