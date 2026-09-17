import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/gateway";

const page = getDocPage("/gateway")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Gateway() {
  return (
    <DocPage page={page}>
      <p>
        The Auton gateway is an OpenAI-compatible proxy. Point any compatible
        client at it — balances deduct per token from your forward compute
        balance.
      </p>
      <p>
        For step-by-step agent integration (OpenAI SDK, LangChain, streaming,
        error handling), see <Link to="/agents">For Agents</Link>.
      </p>

      <h2 id="compatibility">Compatibility</h2>
      <p>
        The gateway proxies to OpenRouter-compatible model routes. Works with
        the OpenAI SDK, LangChain, Cursor, and any tool that accepts a custom{" "}
        <code>baseURL</code> and API key.
      </p>
      <pre>
        <code>{`curl https://api.autonairh.xyz/api/v1/gateway/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_AUTON_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "deepseek/deepseek-chat", "messages": [{"role": "user", "content": "Hello"}]}'`}</code>
      </pre>

      <h2 id="auth">Authentication</h2>
      <p>
        Create API keys in the{" "}
        <a href="https://www.autonairh.xyz/dashboard" target="_blank" rel="noopener noreferrer">
          dashboard
        </a>
        . Keys start with <code>auton_sk_</code>, are hashed at rest, and passed
        as Bearer tokens. Each key is tied to your wallet and forward balances.
      </p>

      <h2 id="billing">Billing</h2>
      <p>
        Usage is metered per token against your locked rate. When a forward
        balance hits zero, requests return <code>402 Payment Required</code> —
        purchase more capacity on the marketplace to continue.
      </p>
    </DocPage>
  );
}
