import type { Route } from "./+types/markets";
import { MarketplacePage } from "../components/marketplace-page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Compute Marketplace — Auton" },
    {
      name: "description",
      content:
        "Browse forward compute contracts — hedge volatility, guarantee capacity, and lock in fixed inference rates.",
    },
  ];
}

export default function Markets() {
  return <MarketplacePage />;
}
