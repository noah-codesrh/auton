import { Link } from "react-router";
import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/chat";

const page = getDocPage("/chat")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Chat() {
  return (
    <DocPage page={page}>
      <p>
        Auton Chat is a hosted chat interface for talking to AI models with a
        single, prepaid credit balance. Top up once with{" "}
        <span className="dollar">$</span>AUTO or USDG, then spend that balance
        across any supported model — at a discount to market rates.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        Unlike the <Link to="/markets">forward contracts</Link> on the
        marketplace — which lock a per-model rate for a fixed term — chat credits
        are a flexible, pay-as-you-go wallet. There's nothing to configure: pick
        a model, send a message, and your balance is debited for exactly what you
        use.
      </p>
      <ul>
        <li>One balance works across every supported model</li>
        <li>No API key required — it rides your wallet sign-in session</li>
        <li>Streamed responses with a live balance update after each reply</li>
        <li>Upload images to vision-capable models</li>
      </ul>

      <h2 id="credits">Unified credits</h2>
      <p>
        Credits are denominated in <strong>USD value</strong>. When you top up
        $10, you can spend $10 of inference across any mix of models. Each model
        costs a different amount per token, so cheaper models stretch your
        balance further — exactly like paying spot, but discounted and prepaid.
      </p>

      <h2 id="paying">Paying with $AUTO or USDG</h2>
      <p>
        Top-ups are paid on-chain to the Auton treasury wallet:
      </p>
      <ul>
        <li>
          <strong>USDG</strong> is credited 1:1 — $10 of USDG adds $10 of
          credits.
        </li>
        <li>
          <strong>
            <span className="dollar">$</span>AUTO
          </strong>{" "}
          is valued at the live oracle price at the moment of deposit, then
          credited as the equivalent USD value.
        </li>
      </ul>
      <p>
        The payment is verified on-chain before credits are added, and each
        payment transaction can only be redeemed once.
      </p>

      <h2 id="spending">How spending works</h2>
      <p>
        Every message is metered by tokens used and charged against your balance
        at a <strong>discount to the underlying market rate</strong> — paying
        through Auton costs less than going direct. When your balance reaches
        zero, sending is paused until you top up again.
      </p>
      <p>
        For programmatic, locked-rate access via API keys (agents, bots, CI), use
        the <Link to="/gateway">Gateway</Link> instead — it bills per token
        against forward compute balances.
      </p>

      <h2 id="vision">Image upload (vision)</h2>
      <p>
        Models that accept image input (marked <strong>Vision</strong> in the
        model picker) let you attach images to a message. Ask questions about a
        screenshot, photo, chart, or diagram and the model reasons over the
        image alongside your text.
      </p>
      <ul>
        <li>Supported formats: PNG, JPEG, WebP, and GIF</li>
        <li>
          Large images are downscaled in your browser before sending to keep
          uploads fast
        </li>
        <li>Up to 4 images per message</li>
        <li>
          Image tokens are billed the same way as text — no separate charge
        </li>
      </ul>
      <p>
        Image <em>generation</em> (creating new images as output) is a separate
        capability and is not yet available in chat.
      </p>

      <h2 id="models">Choosing a model</h2>
      <p>
        The model picker lists every supported model with its input and output
        price. A <strong>Vision</strong> badge marks models that accept image
        input, and the attach button appears automatically when such a model is
        selected. Switch models at any time — the same credit balance applies.
      </p>
    </DocPage>
  );
}
