import { useEffect, useState } from "react";
import { fetchAutoPrice, type AutoPriceInfo } from "../lib/api/trade";

export function useAutoPrice() {
  const [price, setPrice] = useState<AutoPriceInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const info = await fetchAutoPrice();
        if (!cancelled) setPrice(info);
      } catch {
        // keep last value
      }
    };

    void load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return price;
}
