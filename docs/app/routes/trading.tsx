import { DocPage } from "../components/doc-page";
import { docMeta, getDocPage } from "../lib/navigation";
import type { Route } from "./+types/trading";

const page = getDocPage("/trading")!;

export function meta({}: Route.MetaArgs) {
  return docMeta(page.slug);
}

export default function Trading() {
  return (
    <DocPage page={page}>
      <p>
        The Trade page turns each compute future into a live, leveraged market.
        You can go <strong>long</strong> (betting compute gets more expensive) or{" "}
        <strong>short</strong> (betting it gets cheaper) on a model tier such as
        DeepSeek, Llama, GPT, or Gemini — posting <strong>$AUTO</strong> or{" "}
        <strong>USDG</strong> as collateral. Settlement, PnL, and liquidations
        run off-chain in Auton's clearinghouse, while your collateral lives in
        the system vault.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        Every market has a <strong>mark price</strong> quoted in USD per million
        tokens ($/M). The mark moves around the real spot rate routed from
        OpenRouter, so the chart reflects the genuine cost of that model's
        compute. You trade the price of that compute, not the tokens themselves.
      </p>
      <ul>
        <li>Pick a market from the dropdown or the top ticker strip</li>
        <li>Choose leverage (1x–10x) and a size in millions of tokens</li>
        <li>Open a long or short, then close any time to realize PnL</li>
        <li>The chart is a live TradingView candlestick feed of the mark price</li>
      </ul>

      <h2 id="collateral">Collateral &amp; buying power</h2>
      <p>
        Auton runs a unified, multi-collateral clearinghouse. Whatever you
        deposit is converted into a single USD <strong>buying power</strong>{" "}
        balance that backs every position:
      </p>
      <ul>
        <li>
          <strong>USDG</strong> — credited 1:1. Deposit $50 USDG → $50 buying
          power.
        </li>
        <li>
          <strong>$AUTO</strong> — credited at the live market price from the
          Jupiter oracle. If $AUTO is $0.006, depositing 10,000 $AUTO →
          ~$60 buying power.
        </li>
      </ul>
      <p>
        Your raw token balances are tracked separately, but all margin, sizing,
        PnL, and liquidation math is done in USD. The side panel shows a live
        $AUTO price ticker and your connected wallet's $AUTO and USDG balances.
      </p>

      <h2 id="deposit">Depositing margin</h2>
      <p>
        Click <strong>Deposit collateral</strong>, choose $AUTO or USDG, and
        enter an amount (or hit Max). Deposits are an ERC-20 transfer on
        Robinhood Chain to the system vault — USDG or $AUTO. Once the transfer
        is verified on-chain, the backend credits the equivalent USD buying
        power to your trading account.
      </p>
      <ul>
        <li>Free margin — available to open new positions</li>
        <li>Locked margin — collateral currently backing open positions</li>
        <li>Equity — total collateral plus unrealized PnL</li>
      </ul>

      <h2 id="open">Opening a position</h2>
      <p>
        Enter a size in millions of tokens and select leverage. The panel shows
        the order value (notional) and margin required before you confirm:
      </p>
      <ul>
        <li>
          <strong>Notional</strong> = size (M) × mark price ($/M)
        </li>
        <li>
          <strong>Margin required</strong> = notional ÷ leverage
        </li>
      </ul>
      <p>
        Example: a 100M position on DeepSeek at $0.84/M is $84 notional. At 2x
        leverage you post $42 of buying power as margin. Click Buy / Long or Sell
        / Short to open; the margin moves from free to locked.
      </p>

      <h2 id="pnl">How PnL works</h2>
      <p>
        Compute prices float like any commodity — driven by model demand,
        launches, and platform speculation. Your unrealized PnL is the difference
        between your entry price and the live mark, scaled by position size:
      </p>
      <ul>
        <li>
          <strong>Long</strong> PnL = (mark − entry) × size (M)
        </li>
        <li>
          <strong>Short</strong> PnL = (entry − mark) × size (M)
        </li>
      </ul>
      <p>
        Because positions are leveraged, gains and losses are amplified relative
        to the margin you posted. Closing a position returns your locked margin
        plus realized PnL to your free balance.
      </p>

      <h2 id="liquidation">Liquidation</h2>
      <p>
        A background risk engine re-checks every open position every few seconds.
        If the mark price moves far enough against you that your margin can no
        longer cover the loss, the position is liquidated. Liquidation price is
        set from your leverage and a maintenance-margin buffer:
      </p>
      <ul>
        <li>
          <strong>Long</strong> liquidates roughly when the mark falls by{" "}
          (1 ÷ leverage) from entry
        </li>
        <li>
          <strong>Short</strong> liquidates roughly when the mark rises by{" "}
          (1 ÷ leverage) from entry
        </li>
      </ul>
      <p>
        On liquidation the locked collateral is seized by the clearinghouse.
        Higher leverage means a tighter liquidation price — use it carefully.
      </p>

      <h2 id="orderbook">Order book &amp; trades</h2>
      <p>
        Each market shows a live order book and a trade tape. Real on-chain
        purchases of that model's compute appear in the tape (marked with a dot)
        alongside simulated market activity, so the book reflects genuine demand
        for the underlying compute while staying liquid enough to read.
      </p>

      <h2 id="risk">Risk &amp; disclaimers</h2>
      <p>
        Leverage can wipe out your collateral quickly. Compute markets are
        volatile and the mark price can gap. Only post collateral you can afford
        to lose, and treat liquidation prices as approximate. Trading is an MVP
        feature and not financial advice.
      </p>
    </DocPage>
  );
}
