import { DOCS_URL } from "../lib/site-urls";
import { TokenAddress } from "./token-address";

const TOKEN_STEPS = [
  {
    step: "01",
    title: "Futures Collateral",
    description:
      "Want to lock in GPU capacity at today's price for next month? You post $AUTO as margin. Every open position = $AUTO locked off market. More AI builders = more positions = more $AUTO absorbed.",
  },
  {
    step: "02",
    title: "Verifier Staking",
    description:
      "Compute suppliers stake $AUTO to guarantee their SLA. Go offline mid-contract → get slashed. Stay online → earn a cut of every settlement in $USDC. Slashing risk keeps supply locked longer than pure yield staking.",
  },
  {
    step: "03",
    title: "Buyback & Burn",
    description:
      "100% of futures settlement fees → treasury. Half burns $AUTO on the open market. Half goes to stakers in $USDC.",
  },
] as const;

export function AutoTokenSection() {
  return (
    <section id="auto" className="border-t border-black/10 bg-white py-12 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 flex flex-col items-center gap-5 text-center md:mb-16">
          <h2 className="pixel-serif text-3xl text-black md:text-4xl lg:text-5xl">
            How <span className="dollar">$</span>AUTO works:
          </h2>
          <p className="pixel-sans max-w-xl text-sm text-black/60">
            The settlement and collateral asset of the venue. Every contract
            settled programmatically buys back and burns supply.
          </p>
          <TokenAddress variant="light" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {TOKEN_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 md:p-8"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="pixel-serif text-3xl text-black/40 md:text-4xl">
                  {item.step}
                </span>
              </div>
              <h3 className="pixel-serif mb-3 text-lg text-black md:text-xl">
                {item.title}
              </h3>
              <p className="pixel-sans text-sm leading-relaxed text-black/70">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center md:mt-16">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-sans inline-block text-xs text-[#4f7299]/70 transition-colors hover:text-[#4f7299] md:text-sm"
          >
            Learn more about <span className="dollar">$</span>AUTO →
          </a>
        </div>
      </div>
    </section>
  );
}
