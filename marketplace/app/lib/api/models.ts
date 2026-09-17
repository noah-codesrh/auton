import { request } from "./client";

export type ModelCategoryId = "all" | "text" | "image" | "audio" | "video" | "file";

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
  categories: Exclude<ModelCategoryId, "all">[];
  provider: string;
  tier: string | null;
  available: boolean;
};

export type ModelDirectory = {
  syncedAt: string | null;
  error: string | null;
  total: number;
  availableCount: number;
  categories: { id: ModelCategoryId; label: string; count: number }[];
  models: DirectoryModel[];
};

export async function fetchModelDirectory() {
  return request<ModelDirectory>("/api/v1/marketplace/models");
}
