import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/agents";

const page = getDocPage("/agents")!;

const GATEWAY_URL =
  "https://api.autonairh.xyz/api/v1/gateway/v1/chat/completions";

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Agents() {
  return (
    <DocPage page={page}>
      <p>
        Any agent, bot, or automation that speaks the OpenAI Chat Completions API
        can route inference through Auton. Point it at the gateway, pass an Auton
        API key, and usage deducts from your forward compute balance at the
        locked rate you purchased.
      </p>
      <p>
        <strong>No SDK required — if it works with OpenAI, it works with Auton.</strong>
      </p>

      <h2 id="quick-start">Quick start</h2>
      <ol>
        <li>
          Connect a Robinhood wallet on{" "}
          <a href="https://www.autonairh.xyz/dashboard" target="_blank" rel="noopener noreferrer">
            autonairh.xyz/dashboard
          </a>
        </li>
        <li>Sign the login message to activate your session</li>
        <li>Create an API key (starts with <code>auton_sk_</code>)</li>
        <li>
          Set <code>OPENAI_API_KEY</code> (or your agent&apos;s equivalent) to
          that key
        </li>
        <li>
          Set <code>OPENAI_BASE_URL</code> to{" "}
          <code>https://api.autonairh.xyz/api/v1/gateway/v1</code>
        </li>
        <li>Send chat completion requests as normal</li>
      </ol>

      <h2 id="base-url">Base URL</h2>
      <table>
        <thead>
          <tr>
            <th>Setting</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API base</td>
            <td>
              <code>https://api.autonairh.xyz</code>
            </td>
          </tr>
          <tr>
            <td>OpenAI-compatible base</td>
            <td>
              <code>https://api.autonairh.xyz/api/v1/gateway/v1</code>
            </td>
          </tr>
          <tr>
            <td>Chat completions</td>
            <td>
              <code>{GATEWAY_URL}</code>
            </td>
          </tr>
          <tr>
            <td>Auth header</td>
            <td>
              <code>Authorization: Bearer auton_sk_...</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="curl">curl</h2>
      <pre>
        <code>{`curl ${GATEWAY_URL} \\
  -H "Authorization: Bearer $AUTON_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek/deepseek-chat",
    "messages": [
      {"role": "system", "content": "You are a helpful agent."},
      {"role": "user", "content": "Summarize what Auton does in one sentence."}
    ],
    "max_tokens": 100
  }'`}</code>
      </pre>

      <h2 id="openai-sdk">OpenAI SDK (Node / Python)</h2>
      <p>
        Use the official OpenAI client with a custom <code>baseURL</code>. Your
        agent code stays unchanged — only env vars differ.
      </p>

      <h3>TypeScript</h3>
      <pre>
        <code>{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AUTON_API_KEY, // auton_sk_...
  baseURL: "https://api.autonairh.xyz/api/v1/gateway/v1",
});

const response = await client.chat.completions.create({
  model: "deepseek/deepseek-chat",
  messages: [{ role: "user", content: "Hello from my agent" }],
});

console.log(response.choices[0].message.content);`}</code>
      </pre>

      <h3>Python</h3>
      <pre>
        <code>{`from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ["AUTON_API_KEY"],
    base_url="https://api.autonairh.xyz/api/v1/gateway/v1",
)

response = client.chat.completions.create(
    model="deepseek/deepseek-chat",
    messages=[{"role": "user", "content": "Hello from my agent"}],
)

print(response.choices[0].message.content)`}</code>
      </pre>

      <h2 id="streaming">Streaming</h2>
      <p>
        Set <code>stream: true</code> in the request body. The gateway returns
        Server-Sent Events in OpenAI format. Token usage is deducted after the
        stream completes.
      </p>
      <pre>
        <code>{`const stream = await client.chat.completions.create({
  model: "deepseek/deepseek-chat",
  messages: [{ role: "user", content: "Write a haiku about compute." }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}`}</code>
      </pre>

      <h2 id="supported-models">Supported models</h2>
      <p>
        Each model maps to a forward contract tier. Your wallet must hold an
        active balance for that tier or the gateway returns{" "}
        <code>402 Payment Required</code>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Tier</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>deepseek/deepseek-chat</code>
            </td>
            <td>DEEPSEEK_JULY26</td>
          </tr>
          <tr>
            <td>
              <code>deepseek/deepseek-coder</code>
            </td>
            <td>DEEPSEEK_JULY26</td>
          </tr>
          <tr>
            <td>
              <code>deepseek/deepseek-r1</code>
            </td>
            <td>DEEPSEEK_JULY26</td>
          </tr>
          <tr>
            <td>
              <code>meta-llama/llama-3.3-70b-instruct</code>
            </td>
            <td>LLAMA_AUG26</td>
          </tr>
          <tr>
            <td>
              <code>meta-llama/llama-3.1-70b-instruct</code>
            </td>
            <td>LLAMA_AUG26</td>
          </tr>
          <tr>
            <td>
              <code>meta-llama/llama-3.1-8b-instruct</code>
            </td>
            <td>LLAMA_AUG26</td>
          </tr>
        </tbody>
      </table>

      <h2 id="agent-frameworks">Agent frameworks</h2>
      <p>
        Any framework that accepts a custom OpenAI base URL and API key works
        out of the box:
      </p>
      <ul>
        <li>
          <strong>Cursor / Claude Code / Windsurf</strong> — set custom OpenAI
          endpoint in provider settings
        </li>
        <li>
          <strong>LangChain</strong> —{" "}
          <code>ChatOpenAI(openai_api_base=..., openai_api_key=...)</code>
        </li>
        <li>
          <strong>LlamaIndex</strong> —{" "}
          <code>OpenAI(api_base=..., api_key=...)</code>
        </li>
        <li>
          <strong>AutoGPT / CrewAI / LangGraph</strong> — set{" "}
          <code>OPENAI_API_BASE</code> and <code>OPENAI_API_KEY</code> env vars
        </li>
        <li>
          <strong>Custom agents</strong> — any HTTP client that POSTs to{" "}
          <code>/chat/completions</code>
        </li>
      </ul>

      <h3>LangChain (Python)</h3>
      <pre>
        <code>{`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="deepseek/deepseek-chat",
    openai_api_key=os.environ["AUTON_API_KEY"],
    openai_api_base="https://api.autonairh.xyz/api/v1/gateway/v1",
)

llm.invoke("What is a compute forward contract?")`}</code>
      </pre>

      <h2 id="errors">Error responses</h2>
      <p>Agents should handle these HTTP status codes:</p>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Code</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>401</td>
            <td>
              <code>invalid_api_key</code>
            </td>
            <td>Missing, malformed, or revoked API key</td>
          </tr>
          <tr>
            <td>402</td>
            <td>
              <code>payment_required</code>
            </td>
            <td>
              No forward balance, expired contract, or zero tokens remaining
            </td>
          </tr>
          <tr>
            <td>400</td>
            <td>
              <code>missing_model</code>
            </td>
            <td>
              <code>model</code> field missing from request body
            </td>
          </tr>
          <tr>
            <td>400</td>
            <td>—</td>
            <td>Model not mapped to an active tier</td>
          </tr>
        </tbody>
      </table>
      <pre>
        <code>{`{
  "error": {
    "message": "Insufficient compute token balance",
    "type": "insufficient_compute_balance",
    "code": "payment_required"
  }
}`}</code>
      </pre>

      <h2 id="env-vars">Environment variables</h2>
      <p>Recommended env vars for agent deployments:</p>
      <pre>
        <code>{`AUTON_API_KEY=auton_sk_your_key_here
OPENAI_API_KEY=auton_sk_your_key_here          # alias for OpenAI-compatible tools
OPENAI_BASE_URL=https://api.autonairh.xyz/api/v1/gateway/v1`}</code>
      </pre>
      <p>
        Never commit API keys. Use your platform&apos;s secrets manager (Railway,
        Vercel, Docker secrets, etc.).
      </p>

      <h2 id="billing-agents">Billing for agents</h2>
      <ul>
        <li>
          Each completion deducts <code>usage.total_tokens</code> from your
          forward balance for the matching tier
        </li>
        <li>
          Balances are token-denominated — purchased at a locked rate on the{" "}
          <Link to="/markets">marketplace</Link>
        </li>
        <li>
          When balance hits zero, agents receive <code>402</code> — top up by
          purchasing more capacity
        </li>
        <li>
          Usage is logged per request in <code>usage_logs</code> (visible via
          dashboard)
        </li>
      </ul>

      <h2 id="health">Health checks</h2>
      <p>
        Agents and orchestrators can probe backend availability before routing
        traffic:
      </p>
      <pre>
        <code>{`GET https://api.autonairh.xyz/health
GET https://api.autonairh.xyz/health/db
GET https://api.autonairh.xyz/api/v1/config`}</code>
      </pre>
      <p>
        See the full REST reference on the <Link to="/api">API</Link> page and
        gateway details on <Link to="/gateway">Gateway</Link>.
      </p>
    </DocPage>
  );
}
