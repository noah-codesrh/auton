import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/markets";

const page = getDocPage("/markets")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Markets() {
  return (
    <DocPage page={page}>
      <p>
        The Auton marketplace lists forward contracts and capacity commitments.
        Each contract locks a rate, defines supported models, and sets an expiry.
      </p>

      <h2 id="futures">Futures</h2>
      <p>
        Futures lock inference rates for a model tier through a fixed expiry.
        Example: DeepSeek Forward at $0.14/M through July 2026 vs $0.22/M spot —
        a ~36% hedge. Llama Forward covers Llama 3.x models through August 2026.
      </p>
      <ul>
        <li>Hedge volatility before spot moves</li>
        <li>Gateway-ready — use immediately after purchase</li>
        <li>On-chain settlement at expiry</li>
      </ul>

      <h2 id="capacity">Capacity</h2>
      <p>
        Capacity commitments reserve decentralized GPU hours with SLA backing.
        Q3 GPU Commitment covers dedicated GPU hours through September 2026 at
        $0.95/M locked vs $1.40/M spot. Verifier staking is required.
      </p>
      <ul>
        <li>Priority scheduling for committed workloads</li>
        <li>SLA-backed with slashing for downtime</li>
        <li>Ideal for training runs and batch jobs</li>
      </ul>

      <h2 id="purchase">Purchasing</h2>
      <p>
        Connect your wallet, select a contract, and purchase with USDG. Minimum
        sizes vary by tier — from 100K tokens for capacity to 1M for DeepSeek
        futures. Balances appear in your dashboard and activate gateway access
        immediately.
      </p>
    </DocPage>
  );
}
