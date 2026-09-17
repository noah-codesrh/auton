import { env } from "../config/env.js";
import { OPENROUTER_HEADERS } from "../config/models.js";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const CACHE_TTL_MS = 10 * 60 * 1000;

export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
  };
};

type ModelsCache = {
  fetchedAt: number;
  models: Map<string, OpenRouterModel>;
};

let cache: ModelsCache | null = null;

export async function fetchOpenRouterModels(): Promise<Map<string, OpenRouterModel>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.models;
  }

  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      ...OPENROUTER_HEADERS,
    },
  });

  if (!response.ok) {
    throw new OpenRouterError(
      `OpenRouter models API returned ${response.status}`,
      response.status,
    );
  }

  const payload = (await response.json()) as { data?: OpenRouterModel[] };
  const models = new Map<string, OpenRouterModel>();

  for (const model of payload.data ?? []) {
    models.set(model.id, model);
    models.set(model.id.toLowerCase(), model);
  }

  cache = { fetchedAt: Date.now(), models };
  return models;
}

/** Blended spot USD / million tokens from OpenRouter per-token pricing. */
export function openRouterSpotRatePerM(model: OpenRouterModel): number | null {
  const prompt = Number(model.pricing?.prompt ?? 0);
  const completion = Number(model.pricing?.completion ?? 0);

  if (!Number.isFinite(prompt) || !Number.isFinite(completion)) {
    return null;
  }

  if (prompt === 0 && completion === 0) {
    return null;
  }

  const blendedPerToken = (prompt + completion) / 2;
  return blendedPerToken * 1_000_000;
}

export function enrichModelFromOpenRouter(
  modelId: string,
  openRouterModels: Map<string, OpenRouterModel>,
) {
  const live = openRouterModels.get(modelId) ?? openRouterModels.get(modelId.toLowerCase());

  return {
    id: modelId,
    name: live?.name ?? modelId,
    description: live?.description ?? null,
    contextLength: live?.context_length ?? null,
    spotRatePerM: live ? openRouterSpotRatePerM(live) : null,
    openRouterAvailable: Boolean(live),
    pricing: live?.pricing ?? null,
  };
}

export class OpenRouterError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "OpenRouterError";
    this.statusCode = statusCode;
  }
}
