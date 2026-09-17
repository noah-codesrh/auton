import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/user-guide";

const page = getDocPage("/user-guide")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function UserGuide() {
  return (
    <DocPage page={page}>
      <p>
        This guide walks through using Auton as a compute consumer — from wallet
        connection to running your first locked-rate inference call.
      </p>

      <h2 id="connect">Connect wallet</h2>
      <p>
        Open the app and sign in with your Robinhood Chain wallet via Privy. The
        backend issues a JWT after you sign a nonce message — no email or
        password required.
      </p>

      <h2 id="buy">Buy forward balance</h2>
      <p>
        Browse the marketplace and pick a contract that matches your model tier
        and timeline. Purchase with USDG on Robinhood Chain. Your forward compute
        balance appears
        in the dashboard with the locked rate and remaining tokens.
      </p>

      <h2 id="api-key">Create an API key</h2>
      <p>
        In the dashboard, generate a gateway API key. Copy it immediately — it is
        only shown once. Use this key as a Bearer token against the Auton
        gateway endpoint.
      </p>

      <h2 id="infer">Run inference</h2>
      <p>
        Configure your OpenAI-compatible client with the Auton gateway base URL
        and your API key. Send chat completion requests as normal. Token usage
        deducts from your forward balance at the locked rate you purchased.
      </p>
      <p>
        See <Link to="/agents">For Agents</Link> for curl, OpenAI SDK, LangChain,
        streaming, and error handling examples.
      </p>
    </DocPage>
  );
}
