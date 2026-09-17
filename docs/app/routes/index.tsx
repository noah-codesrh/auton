import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/index";

const page = getDocPage("/")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Index() {
  return (
    <DocPage page={page}>
      <p>
        Auton is the derivatives layer for decentralized compute. Instead of
        paying volatile spot rates to centralized providers, Auton lets you lock
        in forward prices, reserve GPU capacity, and route inference through an
        open gateway — all settled on-chain.
      </p>
      <p>
        <strong>
          Compute derivatives on-chain, not corporate contracts.
        </strong>
      </p>

      <h2 id="how-it-works">How it works</h2>
      <p>
        You browse forward contracts on the marketplace. You lock in a rate with
        USDG and receive tokenized compute balance. Point any OpenAI-compatible
        client at the Auton gateway — your balance deducts per token as
        inference runs. Providers stake <span className="dollar">$</span>AUTO to
        back SLAs. Settlements flow in USDG. No intermediary deciding your
        price or revoking your access.
      </p>

      <h2 id="two-tiers">Two tiers</h2>
      <table>
        <thead>
          <tr>
            <th>Tier</th>
            <th>Model</th>
            <th>Cost</th>
            <th>Where it runs</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Futures</strong>
            </td>
            <td>DeepSeek Forward</td>
            <td>$0.14/M locked</td>
            <td>Auton gateway</td>
            <td>Hedge volatility through July 2026; gateway-ready</td>
          </tr>
          <tr>
            <td>
              <strong>Futures</strong>
            </td>
            <td>Llama Forward</td>
            <td>$0.18/M locked</td>
            <td>Auton gateway</td>
            <td>Multi-model tier; capacity guarantee eligible</td>
          </tr>
          <tr>
            <td>
              <strong>Capacity</strong>
            </td>
            <td>Q3 GPU Commitment</td>
            <td>$0.95/M locked</td>
            <td>Native providers</td>
            <td>SLA-backed GPU hours; verifier staking required</td>
          </tr>
        </tbody>
      </table>

      <h2 id="credits-and-auto">Credits and the $AUTO token</h2>
      <p>
        Forward balances are purchased with USDG at the locked rate shown on each
        contract. You don't need <span className="dollar">$</span>AUTO to use
        Auton as a consumer.
      </p>
      <ul>
        <li>
          Buy tokenized compute capacity at today's locked rate before spot moves
        </li>
        <li>
          Providers earn 70% of settlement value in USDG (80% if they stake{" "}
          <span className="dollar">$</span>AUTO)
        </li>
        <li>
          Liquidity participants earn fees from on-chain derivatives markets
        </li>
      </ul>
      <p>
        <span className="dollar">$</span>AUTO is the protocol token — futures
        collateral, verifier staking, and treasury buyback. Network revenue
        automatically buys it back and burns half; the other half goes to
        stakers in USDG.
      </p>
      <p>
        See <Link to="/auto-token">The $AUTO Token</Link> for the full breakdown.
      </p>

      <h2 id="the-stack">The stack</h2>
      <ul>
        <li>
          <strong>Marketplace</strong> — browse and purchase forward contracts
          and capacity commitments
        </li>
        <li>
          <strong>Gateway</strong> — OpenRouter-compatible proxy; balances deduct
          per token
        </li>
        <li>
          <strong>Backend API</strong> — Express + Supabase for auth, keys,
          staking, and usage logs
        </li>
        <li>
          <strong>On-chain</strong> — Solana wallet signatures, Streamflow
          staking, and on-chain settlement
        </li>
      </ul>

      <h2 id="why">Why?</h2>
      <p>
        Centralized cloud providers lock you into spot pricing, opaque SLAs, and
        revocable API keys. Auton is the alternative — transparent, on-chain,
        and owned by the community.
      </p>
      <p>
        Anyone can hedge compute costs, guarantee capacity, provide liquidity, or
        contribute GPU supply and start earning.
      </p>
    </DocPage>
  );
}
