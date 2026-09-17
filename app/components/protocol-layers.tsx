type LayerStatus = "live" | "entry" | "building" | "roadmap";

type Layer = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: LayerStatus;
};

const LAYERS: Layer[] = [
  {
    id: "L1",
    name: "Spot Markets",
    tagline: "Raw access, settled instantly",
    description:
      "Immediate compute, storage, bandwidth, and GPUs traded at the live clearing price.",
    status: "live",
  },
  {
    id: "L2",
    name: "Futures Markets",
    tagline: "Our entry point",
    description:
      "Lock in guaranteed inference capacity weeks or months ahead of time — e.g. cDEEPSEEK-SEP26.",
    status: "entry",
  },
  {
    id: "L3",
    name: "Yield Curves",
    tagline: "Infrastructure bond markets",
    description:
      "Forward curves across maturities turn locked capacity into a fixed-income market for machine resources.",
    status: "building",
  },
  {
    id: "L4",
    name: "Derivatives",
    tagline: "Options, perps & spreads",
    description:
      "Options on compute, perpetuals, calendar spreads, and capacity insurance for any workload.",
    status: "roadmap",
  },
  {
    id: "L5",
    name: "Macro Indexes",
    tagline: "The price of AI labor",
    description:
      "Tradable baskets like INF100 and AGENT CPI that track the real cost of running the autonomous economy.",
    status: "roadmap",
  },
  {
    id: "L6",
    name: "Agent Treasury Management",
    tagline: "Agents that hedge themselves",
    description:
      "Autonomous agent swarms programmatically hedge their own compute overhead — like airlines hedging jet fuel.",
    status: "roadmap",
  },
  {
    id: "L7",
    name: "Resource-Backed Stablecoins",
    tagline: "Introducing iUSD",
    description:
      "A reserve asset backed entirely by locked, productive units of global machine compute.",
    status: "roadmap",
  },
  {
    id: "L8",
    name: "Universal Infrastructure Exchange",
    tagline: "Web2 meets DePIN",
    description:
      "One global market uniting giants like Nvidia and AWS with DePIN protocols like Akash and Filecoin.",
    status: "roadmap",
  },
];

const LIVE_LAYERS = LAYERS.filter(
  (layer) => layer.status === "live" || layer.status === "entry",
);

const STATUS_META: Record<LayerStatus, { label: string; className: string }> = {
  live: {
    label: "Live",
    className: "border-[#80a0c1]/50 bg-[#80a0c1]/15 text-[#4f7299]",
  },
  entry: {
    label: "Live · Entry Point",
    className: "border-[#80a0c1]/50 bg-[#80a0c1]/15 text-[#4f7299]",
  },
  building: {
    label: "Building",
    className: "border-black/15 bg-black/[0.03] text-black/55",
  },
  roadmap: {
    label: "Roadmap",
    className: "border-black/10 bg-transparent text-black/40",
  },
};

function LayerRow({ layer }: { layer: Layer }) {
  const status = STATUS_META[layer.status];
  const isEntry = layer.status === "entry";

  return (
    <div
      className={`group relative flex flex-col gap-3 rounded-2xl border p-5 transition-colors md:flex-row md:items-center md:gap-6 md:p-6 ${
        isEntry
          ? "border-[#80a0c1]/50 bg-[#80a0c1]/[0.08]"
          : "border-black/10 bg-black/[0.02] hover:bg-black/[0.04]"
      }`}
    >
      <div className="flex items-center gap-4 md:w-56 md:shrink-0">
        <span className="pixel-serif text-2xl text-black/25 md:text-3xl">
          {layer.id}
        </span>
        <div>
          <h3 className="pixel-serif text-lg text-black md:text-xl">
            {layer.name}
          </h3>
          <p className="pixel-sans text-xs text-[#4f7299]">{layer.tagline}</p>
        </div>
      </div>

      <p className="pixel-sans flex-1 text-sm text-black/65">
        {layer.description}
      </p>

      <span
        className={`pixel-sans inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-medium tracking-widest uppercase ${status.className}`}
      >
        {status.label}
      </span>
    </div>
  );
}

export function ProtocolLayers() {
  return (
    <section
      id="protocol"
      className="border-t border-black/10 bg-white py-12 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 max-w-2xl md:mb-14">
          <span className="pixel-sans text-xs tracking-widest text-[#4f7299] uppercase">
            Live Now
          </span>
          <h2 className="pixel-serif mt-3 text-3xl text-black md:text-4xl lg:text-5xl">
            Markets live today
          </h2>
          <p className="pixel-sans mt-4 text-sm text-black/60 md:text-base">
            Auton turns everything the autonomous economy depends on into
            tradable financial primitives. These layers are live and trading
            now — the first steps toward a single clearinghouse for global
            compute.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          {LIVE_LAYERS.map((layer) => (
            <LayerRow key={layer.id} layer={layer} />
          ))}
        </div>
      </div>
    </section>
  );
}
