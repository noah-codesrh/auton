import { AutoBuybackIllustration } from "./auto-buyback-illustration";
import { TokenAddress } from "./token-address";

const LOOP = [
  { label: "Settlement fees", detail: "Every contract settled" },
  { label: "Treasury", detail: "Revenue is collected" },
  { label: "Open-market buy", detail: "Treasury purchases $AUTO" },
  { label: "Supply reduced", detail: "Bought tokens are burned" },
] as const;

export function AutoTokenSection() {
  return (
    <section id="auto" className="border-t border-black/10 bg-white py-12 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 flex flex-col items-center gap-5 text-center md:mb-14">
          <h2 className="pixel-serif text-3xl text-black md:text-4xl lg:text-5xl">
            Every fee buys back <span className="dollar">$</span>AUTO
          </h2>
          <p className="pixel-sans max-w-xl text-sm leading-relaxed text-black/60 md:text-base">
            Settlement fees flow into the treasury and buy $AUTO on the open
            market. Every contract closed programmatically reduces supply.
          </p>
          <TokenAddress variant="light" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/10 bg-black/[0.015] px-3 py-6 md:px-8 md:py-8">
          <AutoBuybackIllustration />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {LOOP.map((item, index) => (
            <div key={item.label} className="text-center md:text-left">
              <p className="pixel-sans text-[10px] tracking-[0.18em] text-black/35 uppercase">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="pixel-serif mt-1 text-base text-black">{item.label}</p>
              <p className="pixel-sans mt-1 text-xs text-black/50">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
