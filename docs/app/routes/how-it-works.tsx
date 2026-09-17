import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/how-it-works";

const page = getDocPage("/how-it-works")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function HowItWorks() {
  return (
    <DocPage page={page}>
      <p>
        Auton connects compute consumers, providers, and liquidity participants
        through on-chain forward markets and an OpenAI-compatible gateway.
      </p>

      <h2 id="browse">Browse markets</h2>
      <p>
        Open the marketplace and filter by futures or capacity contracts. Each
        listing shows a locked rate, spot reference price, expiry, supported
        models, and minimum purchase size. Savings vs spot are displayed upfront.
      </p>

      <h2 id="lock">Lock a rate</h2>
      <p>
        Purchase forward balance with USDG. Your tokens represent locked-rate
        compute capacity tied to a specific contract tier — e.g. DeepSeek Forward
        through July 2026 at $0.14/M. Balances appear in your dashboard and
        deduct only when you consume inference.
      </p>

      <h2 id="route">Route inference</h2>
      <p>
        Create an API key in the dashboard. Point any OpenAI-compatible client
        at the Auton gateway with your key as a Bearer token. Requests proxy
        through OpenRouter-compatible routing; usage logs track token consumption
        against your forward balance.
      </p>

      <h2 id="settle">Settle on-chain</h2>
      <p>
        Futures settlement fees flow to the treasury. Half burns{" "}
        <span className="dollar">$</span>AUTO on the open market; half goes to
        stakers in USDG. Providers who fulfill capacity commitments earn
        settlements — boosted to 80% payout when staked. Verifiers who breach
        SLA get slashed.
      </p>
    </DocPage>
  );
}
