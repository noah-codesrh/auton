import { useEffect, useState } from "react";
import { fetchIndexes, type IndexesResponse } from "../lib/api/indexes";

const POLL_MS = 6_000;

export function useIndexes() {
  const [data, setData] = useState<IndexesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetchIndexes();
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load indexes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { data, indexes: data?.indexes ?? [], loading, error };
}
