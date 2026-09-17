import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/api";

const page = getDocPage("/api")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Api() {
  return (
    <DocPage page={page}>
      <p>
        Base URL: <code>https://api.autonairh.xyz</code>
      </p>

      <h2 id="auth">Auth</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Auth</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>GET</td>
            <td>
              <code>/api/v1/auth/nonce/:wallet</code>
            </td>
            <td>—</td>
            <td>Get sign-in message</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/api/v1/auth/login</code>
            </td>
            <td>—</td>
            <td>Verify signature, issue JWT</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/api/v1/config</code>
            </td>
            <td>—</td>
            <td>Public chain config (mint, vault, decimals)</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/health</code>
            </td>
            <td>—</td>
            <td>Service health</td>
          </tr>
        </tbody>
      </table>

      <h2 id="dashboard">Dashboard</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Auth</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>GET</td>
            <td>
              <code>/api/v1/dashboard/</code>
            </td>
            <td>JWT</td>
            <td>API keys, balances, yield</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/api/v1/dashboard/api-keys</code>
            </td>
            <td>JWT</td>
            <td>Create gateway API key</td>
          </tr>
        </tbody>
      </table>

      <h2 id="staking-api">Staking</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Auth</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>POST</td>
            <td>
              <code>/api/v1/stake/deposit</code>
            </td>
            <td>JWT</td>
            <td>Verify & log stake tx</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/api/v1/stake/claim</code>
            </td>
            <td>JWT</td>
            <td>Queue USDG yield payout</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/api/v1/stake/summary</code>
            </td>
            <td>JWT</td>
            <td>Staking totals</td>
          </tr>
        </tbody>
      </table>

      <h2 id="gateway-api">Gateway</h2>
      <p>
        OpenAI-compatible inference proxy. See{" "}
        <Link to="/agents">For Agents</Link> for integration examples.
      </p>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Auth</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ANY</td>
            <td>
              <code>/api/v1/gateway/*</code>
            </td>
            <td>API Key</td>
            <td>OpenRouter proxy</td>
          </tr>
        </tbody>
      </table>
    </DocPage>
  );
}
