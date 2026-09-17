import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/architecture";

const page = getDocPage("/architecture")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Architecture() {
  return (
    <DocPage page={page}>
      <p>
        Auton is a permissionless protocol where providers, consumers, and
        liquidity participants trade compute derivatives on-chain.
      </p>

      <h2 id="overview">Overview</h2>
      <ul>
        <li>
          <strong>Frontend</strong> — React Router app for markets, dashboard,
          staking, and treasury
        </li>
        <li>
          <strong>Backend API</strong> — Express server handling auth, keys,
          balances, and gateway proxy
        </li>
        <li>
          <strong>Database</strong> — Supabase Postgres for users, API keys,
          compute balances, staking ledger, and usage logs
        </li>
        <li>
          <strong>Chain</strong> — Robinhood Chain for wallet auth, USDG
          settlement, and the $AUTO ERC-20. Streamflow staking is not on
          Robinhood yet.
        </li>
      </ul>

      <h2 id="backend">Backend API</h2>
      <p>
        Wallet auth uses EVM personal_sign messages — not Supabase Auth. A nonce
        endpoint returns a sign-in message; login verifies the signature and
        issues a JWT. All dashboard and staking routes require that JWT.
      </p>
      <pre>
        <code>{`Express API  →  @supabase/supabase-js  →  Supabase Postgres`}</code>
      </pre>

      <h2 id="gateway">Inference gateway</h2>
      <p>
        The gateway is an OpenRouter-compatible proxy mounted at{" "}
        <code>/api/v1/gateway/*</code>. Requests authenticate with Auton API
        keys (hashed at rest). Usage is logged per request and deducted from
        forward compute balances.
      </p>

      <h2 id="on-chain">On-chain layer</h2>
      <p>
        <span className="dollar">$</span>AUTO serves three roles: futures
        margin collateral, verifier staking for SLA guarantees, and treasury
        buyback target. Staking is self-custody via Streamflow — your tokens
        stay in your wallet.
      </p>
    </DocPage>
  );
}
