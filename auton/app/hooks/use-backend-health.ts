import { useEffect, useState } from "react";
import { getBackendUrl } from "../lib/api/autonClient";

export function useBackendHealth() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(`${getBackendUrl()}/health`)
      .then((response) => {
        if (!cancelled) setOnline(response.ok);
      })
      .catch(() => {
        if (!cancelled) setOnline(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { online, apiUrl: getBackendUrl() };
}
