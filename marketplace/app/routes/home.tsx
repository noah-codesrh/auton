import type { Route } from "./+types/home";
import { MarketplacePage } from "../components/marketplace-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("Buy") },
    {
      name: "description",
      content:
        "Purchase LLM inference forward contracts and route agents through the Auton gateway.",
    },
  ];
}

export default function Home() {
  return <MarketplacePage />;
}
