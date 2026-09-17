import { MODEL_TO_TIER } from "../config/models.js";
import {
  fetchOpenRouterModels,
  openRouterSpotRatePerM,
  type OpenRouterModel,
} from "./openrouter.js";

export type ModelCategory =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "file";

export type DirectoryModel = {
  id: string;
  name: string;
  description: string | null;
  contextLength: number | null;
  promptPerM: number | null;
  completionPerM: number | null;
  blendedPerM: number | null;
  isFree: boolean;
  isVariablePrice: boolean;
  inputModalities: string[];
  outputModalities: string[];
  categories: ModelCategory[];
  provider: string;
  tier: string | null;
  available: boolean;
};

export type ModelDirectory = {
  syncedAt: string | null;
  error: string | null;
  total: number;
  availableCount: number;
  categories: { id: "all" | ModelCategory; label: string; count: number }[];
  models: DirectoryModel[];
};

const CATEGORY_LABELS: Record<ModelCategory, string> = {
  text: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
  file: "File",
};

const CATEGORY_ORDER: ModelCategory[] = [
  "text",
  "image",
  "audio",
  "video",
  "file",
];

function perMillion(perToken?: string): number | null {
  if (perToken === undefined) return null;
  const value = Number(perToken);
  if (!Number.isFinite(value) || value < 0) return null;
  return value * 1_000_000;
}

function deriveCategories(model: OpenRouterModel): ModelCategory[] {
  const inputs = model.architecture?.input_modalities ?? [];
  const outputs = model.architecture?.output_modalities ?? [];
  const all = new Set([...inputs, ...outputs]);

  const categories: ModelCategory[] = [];

  if (outputs.includes("text") || all.has("text")) categories.push("text");
  if (all.has("image")) categories.push("image");
  if (all.has("audio")) categories.push("audio");
  if (all.has("video")) categories.push("video");
  if (all.has("file")) categories.push("file");

  return categories.length > 0 ? categories : ["text"];
}

function providerFromId(id: string): string {
  const [vendor] = id.split("/");
  return vendor ?? "openrouter";
}

function toDirectoryModel(model: OpenRouterModel): DirectoryModel {
  const promptPerM = perMillion(model.pricing?.prompt);
  const completionPerM = perMillion(model.pricing?.completion);
  const blendedPerM = openRouterSpotRatePerM(model);
  const isVariablePrice =
    model.pricing?.prompt === "-1" || model.pricing?.completion === "-1";
  const isFree =
    !isVariablePrice &&
    (promptPerM ?? 0) === 0 &&
    (completionPerM ?? 0) === 0;

  const tier = MODEL_TO_TIER[model.id] ?? null;

  return {
    id: model.id,
    name: model.name,
    description: model.description ?? null,
    contextLength: model.context_length ?? null,
    promptPerM,
    completionPerM,
    blendedPerM,
    isFree,
    isVariablePrice,
    inputModalities: model.architecture?.input_modalities ?? ["text"],
    outputModalities: model.architecture?.output_modalities ?? ["text"],
    categories: deriveCategories(model),
    provider: providerFromId(model.id),
    tier,
    available: tier !== null,
  };
}

export async function buildModelDirectory(): Promise<ModelDirectory> {
  let syncedAt: string | null = null;
  let error: string | null = null;
  let models: DirectoryModel[] = [];

  try {
    const map = await fetchOpenRouterModels();

    const seen = new Set<string>();
    const unique: OpenRouterModel[] = [];
    for (const model of map.values()) {
      if (seen.has(model.id)) continue;
      seen.add(model.id);
      unique.push(model);
    }

    models = unique
      .map(toDirectoryModel)
      .sort((a, b) => {
        // Available-on-Auton models first, then by name.
        if (a.available !== b.available) return a.available ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    syncedAt = new Date().toISOString();
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to sync OpenRouter models";
  }

  const categories: ModelDirectory["categories"] = [
    { id: "all", label: "All", count: models.length },
    ...CATEGORY_ORDER.map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category],
      count: models.filter((model) => model.categories.includes(category))
        .length,
    })).filter((entry) => entry.count > 0),
  ];

  return {
    syncedAt,
    error,
    total: models.length,
    availableCount: models.filter((model) => model.available).length,
    categories,
    models,
  };
}
