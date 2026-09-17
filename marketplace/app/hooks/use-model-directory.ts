import { useCallback, useEffect, useState } from "react";
import {
  fetchModelDirectory,
  type ModelDirectory,
} from "../lib/api/models";

const EMPTY: ModelDirectory = {
  syncedAt: null,
  error: null,
  total: 0,
  availableCount: 0,
  categories: [],
  models: [],
};

export function useModelDirectory() {
  const [directory, setDirectory] = useState<ModelDirectory>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchModelDirectory();
      setDirectory(data);
    } catch (err) {
      setDirectory(EMPTY);
      setError(
        err instanceof Error ? err.message : "Could not load model directory",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { directory, loading, error, refresh };
}
