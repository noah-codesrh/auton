import { Link } from "react-router";

const STEPS = [
  { n: "1", title: "Connect", body: "Robinhood wallet" },
  { n: "2", title: "Buy", body: "Lock $/M · pay USDG" },
  { n: "3", title: "Key", body: "API key on account" },
  { n: "4", title: "Infer", body: "Gateway → models" },
];

function FlowArrow({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex justify-center py-1 text-black/25" aria-hidden>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <path
            d="M8 2v16m0 0-4-4m4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="hidden shrink-0 items-center text-black/25 md:flex"
      aria-hidden
    >
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <path
          d="M2 8h24m0 0-4-4m4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FlowNode({
  label,
  hint,
  accent = false,
}: {
  label: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`min-w-[7.5rem] rounded-xl border px-4 py-3 text-center ${
        accent
          ? "border-emerald-600/30 bg-emerald-50"
          : "border-black/10 bg-white"
      }`}
    >
      <div
        className={`pixel-sans text-sm font-medium ${
          accent ? "text-emerald-800" : "text-black"
        }`}
      >
        {label}
      </div>
      {hint && (
        <div className="pixel-mono mt-0.5 text-[10px] text-black/40">{hint}</div>
      )}
    </div>
  );
}

function ArchitectureFlowchart() {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 md:p-8">
      {/* Desktop: horizontal architecture */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center gap-2">
          <FlowNode label="Wallet" hint="Robinhood" />
          <FlowArrow />
          <FlowNode label="Futures" hint="UI" accent />
          <FlowArrow />
          <FlowNode label="Backend" hint="API" />
          <FlowArrow />
          <FlowNode label="Gateway" hint="OpenRouter" />
          <FlowArrow />
          <FlowNode label="Models" hint="DS · Llama" />
        </div>

        <div className="mt-8 flex justify-center">
          <svg
            width="420"
            height="72"
            viewBox="0 0 420 72"
            className="text-black/20"
            aria-hidden
          >
            <path
              d="M210 8v20M210 28h-120v20M210 28h120v20"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M90 56v-4m0 0-3 3m3-3 3 3M330 56v-4m0 0-3 3m3-3 3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <div className="flex items-center justify-center gap-16">
          <FlowNode label="Robinhood" hint="USDG" />
          <FlowNode label="Ledger" hint="credits" />
        </div>
      </div>

      {/* Mobile: vertical stack */}
      <div className="flex flex-col items-center md:hidden">
        <FlowNode label="Wallet" hint="Robinhood" />
        <FlowArrow vertical />
        <FlowNode label="Futures" hint="UI" accent />
        <FlowArrow vertical />
        <FlowNode label="Robinhood" hint="USDG" />
        <FlowArrow vertical />
        <FlowNode label="Backend" hint="ledger" />
        <FlowArrow vertical />
        <FlowNode label="Gateway" />
        <FlowArrow vertical />
        <FlowNode label="Models" hint="DS · Llama" />
      </div>
    </div>
  );
}

export function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-10 text-center">
        <h1 className="pixel-serif text-3xl text-black md:text-4xl">
          How it works
        </h1>
        <p className="pixel-sans mt-3 text-sm text-black/50">
          Lock inference price early. Spend credits at the gateway.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-emerald-600/20 bg-emerald-50/60 px-4 py-3">
        <p className="pixel-sans text-sm text-black/65">
          <span className="font-medium text-emerald-800">
            What&apos;s a future?
          </span>{" "}
          A futures contract lets you pay today&apos;s price now and use it
          later. You lock a fixed rate per million tokens, pay USDG up front, and
          spend those credits anytime before the contract expires — no matter
          where the market price moves.
        </p>
      </div>

      <ArchitectureFlowchart />

      <ol className="mt-10 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="flex items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3"
          >
            <span className="pixel-mono flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-xs text-black/50">
              {step.n}
            </span>
            <div>
              <div className="pixel-sans text-sm font-medium text-black">
                {step.title}
              </div>
              <div className="pixel-sans text-sm text-black/45">{step.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3">
        <p className="pixel-sans text-sm text-black/55">
          <span className="font-medium text-black">Note:</span> you can{" "}
          <Link to="/models" className="text-emerald-700 hover:text-emerald-600">
            browse every model
          </Link>{" "}
          routable through OpenRouter, but only models in an Auton tier can be
          locked at a futures rate. We add tiers over time — more models become
          lockable as we do.
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/"
          className="pixel-sans rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Buy credits
        </Link>
      </div>
    </main>
  );
}
