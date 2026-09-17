import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/auto-token";

const page = getDocPage("/auto-token")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function AutoToken() {
  return (
    <DocPage page={page}>
      <p>
        <span className="dollar">$</span>AUTO is the protocol token that
        collateralizes futures, backs provider SLAs, and accrues value from
        network revenue.
      </p>

      <h2 id="futures-collateral">Futures collateral</h2>
      <p>
        Want to lock in GPU capacity at today's price for next month? You post{" "}
        <span className="dollar">$</span>AUTO as margin. Every open position ={" "}
        <span className="dollar">$</span>AUTO locked off market. More AI builders
        = more positions = more <span className="dollar">$</span>AUTO absorbed.
      </p>

      <h2 id="verifier-staking">Verifier staking</h2>
      <p>
        Compute suppliers stake <span className="dollar">$</span>AUTO to
        guarantee their SLA. Go offline mid-contract → get slashed. Stay online →
        earn a cut of every settlement in USDG. Slashing risk keeps supply locked
        longer than pure yield staking.
      </p>

      <h2 id="buyback-burn">Buyback & burn</h2>
      <p>
        100% of futures settlement fees → treasury. Half burns{" "}
        <span className="dollar">$</span>AUTO on the open market. Half goes to
        stakers in USDG. Track live burn and stake totals on the{" "}
        <a href="https://www.autonairh.xyz/treasury" target="_blank" rel="noopener noreferrer">
          treasury page
        </a>
        .
      </p>
    </DocPage>
  );
}
