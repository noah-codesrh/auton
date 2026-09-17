import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/staking";

const page = getDocPage("/staking")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Staking() {
  return (
    <DocPage page={page}>
      <p>
        Stake <span className="dollar">$</span>AUTO to earn USDG yield and boost
        provider payout rates. Staking is self-custody — your tokens stay in
        your own on-chain wallet.
      </p>

      <h2 id="self-custody">Self-custody staking</h2>
      <p>
        Auton uses Streamflow for staking. Connect your Solana wallet, choose an
        amount, and stake directly — no custodial intermediary. Unstake anytime
        subject to the pool's unlock schedule.
      </p>

      <h2 id="yield">Yield</h2>
      <p>
        Half of treasury inflows from compute margin and trading fees are
        distributed to stakers in USDG. Enable auto-compound to restake rewards
        automatically.
      </p>

      <h2 id="boost">Provider boost</h2>
      <p>
        Providers who stake 1,000,000 <span className="dollar">$</span>AUTO for
        24h boost their worker payout from 70% to 80% of settlement value. This
        aligns supply-side incentives with network security.
      </p>
    </DocPage>
  );
}
