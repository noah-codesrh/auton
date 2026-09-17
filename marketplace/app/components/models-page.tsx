import { useMemo, useState } from "react";
import { Link } from "react-router";
import { contractLabel } from "../config/marketplace";
import { useModelDirectory } from "../hooks/use-model-directory";
import type {
  DirectoryModel,
  ModelCategoryId,
} from "../lib/api/models";

function formatContext(tokens: number | null) {
  if (!tokens) return null;
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`;
  }
  return String(tokens);
}

function formatPrice(perM: number | null) {
  if (perM === null) return "—";
  if (perM === 0) return "Free";
  if (perM < 1) return `$${perM.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${perM.toFixed(2)}`;
}

const MODALITY_ICON: Record<string, string> = {
  text: "T",
  image: "▦",
  audio: "♪",
  video: "▷",
  file: "⎙",
};

function ModelCard({ model }: { model: DirectoryModel }) {
  const context = formatContext(model.contextLength);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-black/25">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="pixel-serif truncate text-lg text-black" title={model.name}>
            {model.name}
          </h2>
          <p className="pixel-mono mt-0.5 truncate text-xs text-black/40" title={model.id}>
            {model.id}
          </p>
        </div>
        {model.available && (
          <span className="pixel-sans shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            On Auton
          </span>
        )}
      </div>

      {model.description && (
        <p className="pixel-sans mb-4 line-clamp-3 text-sm text-black/55">
          {model.description}
        </p>
      )}

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[...new Set([...model.inputModalities, ...model.outputModalities])].map(
            (modality) => (
              <span
                key={modality}
                className="pixel-sans inline-flex items-center gap-1 rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] text-black/55"
                title={modality}
              >
                <span aria-hidden>{MODALITY_ICON[modality] ?? "•"}</span>
                {modality}
              </span>
            ),
          )}
        </div>

        <div className="flex items-center justify-between border-t border-black/5 pt-3 text-xs">
          <div className="pixel-sans text-black/45">
            {context ? `${context} ctx` : "— ctx"}
          </div>
          <div className="pixel-sans flex gap-3 text-black/55">
            {model.isVariablePrice ? (
              <span>Variable price</span>
            ) : (
              <>
                <span title="Input / million tokens">
                  In{" "}
                  <span className="text-black">{formatPrice(model.promptPerM)}</span>
                  /M
                </span>
                <span title="Output / million tokens">
                  Out{" "}
                  <span className="text-black">
                    {formatPrice(model.completionPerM)}
                  </span>
                  /M
                </span>
              </>
            )}
          </div>
        </div>

        {model.available && model.tier && (
          <Link
            to="/"
            className="pixel-sans block rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-500"
          >
            Lock {contractLabel(model.tier, "")} rate
          </Link>
        )}
      </div>
    </article>
  );
}

export function ModelsPage() {
  const { directory, loading, error } = useModelDirectory();
  const [activeCategory, setActiveCategory] = useState<ModelCategoryId>("all");
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return directory.models.filter((model) => {
      if (onlyAvailable && !model.available) return false;
      if (
        activeCategory !== "all" &&
        !model.categories.includes(activeCategory as never)
      ) {
        return false;
      }
      if (!query) return true;
      return (
        model.id.toLowerCase().includes(query) ||
        model.name.toLowerCase().includes(query) ||
        (model.description?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [directory.models, activeCategory, search, onlyAvailable]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-6">
        <h1 className="pixel-serif text-3xl text-black md:text-4xl">Models</h1>
        <p className="pixel-sans mt-2 text-black/50">
          {directory.total > 0
            ? `${directory.total} models routable through OpenRouter · ${directory.availableCount} available to lock on Auton`
            : "Browse models available through the Auton gateway."}
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-black/10 pb-px">
        {directory.categories.map((category) => {
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`pixel-sans flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "border-black text-black"
                  : "border-transparent text-black/45 hover:text-black"
              }`}
            >
              {category.label}
              <span
                className={`pixel-mono rounded px-1 text-[11px] ${
                  active ? "bg-black/5 text-black/60" : "text-black/30"
                }`}
              >
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search models…"
          className="pixel-sans w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-black focus:border-black/30 focus:outline-none sm:max-w-sm"
        />
        <label className="pixel-sans flex shrink-0 cursor-pointer items-center gap-2 text-sm text-black/60">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(event) => setOnlyAvailable(event.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Available on Auton only
        </label>
      </div>

      {error && (
        <div className="pixel-sans mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && directory.models.length === 0 && (
        <p className="pixel-sans text-center text-sm text-black/40">
          Loading models…
        </p>
      )}

      {!loading && filtered.length === 0 && directory.models.length > 0 && (
        <p className="pixel-sans text-center text-sm text-black/40">
          No models match your filters.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="pixel-sans mt-8 text-center text-xs text-black/35">
          Showing {filtered.length} of {directory.total} models · live pricing from
          OpenRouter
        </p>
      )}
    </main>
  );
}
