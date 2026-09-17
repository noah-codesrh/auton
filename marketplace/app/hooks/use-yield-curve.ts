import { useEffect, useState } from "react";
import { fetchYieldCurve, type YieldCurveResponse } from "../lib/api/curve";

const POLL_MS = 15_000;

export function useYieldCurve() {
  const [data, setData] = useState<YieldCurveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetchYieldCurve();
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load yield curve",
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

  return { data, curves: data?.curves ?? [], loading, error };
}
