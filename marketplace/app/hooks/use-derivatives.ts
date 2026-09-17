import { useEffect, useState } from "react";
import {
  fetchDerivatives,
  type DerivativesResponse,
} from "../lib/api/derivatives";

const POLL_MS = 6_000;

export function useDerivatives() {
  const [data, setData] = useState<DerivativesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetchDerivatives();
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load derivatives",
          );
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

  return { data, models: data?.models ?? [], loading, error };
}
