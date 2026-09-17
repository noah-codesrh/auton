import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/provider-guide";

const page = getDocPage("/provider-guide")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function ProviderGuide() {
  return (
    <DocPage page={page}>
      <p>
        This guide covers supplying compute on Auton — registering capacity,
        staking for SLA guarantees, and earning USDG settlements.
      </p>

      <h2 id="register">Register capacity</h2>
      <p>
        Providers register GPU capacity on the network and opt into capacity
        commitment contracts. Your hardware must meet the tier requirements
        (e.g. H100-equivalent for DeepSeek futures, dedicated GPU for Q3
        commitments).
      </p>

      <h2 id="stake-sla">Stake for SLA</h2>
      <p>
        Stake <span className="dollar">$</span>AUTO to back your SLA guarantee.
        If you go offline mid-contract, you get slashed. Stay online and fulfill
        commitments to earn settlements. Staking 1M{" "}
        <span className="dollar">$</span>AUTO for 24h boosts payout from 70% to
        80%.
      </p>

      <h2 id="earn">Earn settlements</h2>
      <p>
        Providers earn USDG from fulfilled capacity commitments and gateway
        routing fees. Settlements are logged on-chain and paid out through the
        staking and claims system. Track treasury inflows and burn metrics on
        the app.
      </p>
    </DocPage>
  );
}
