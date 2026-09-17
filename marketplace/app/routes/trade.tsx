import type { Route } from "./+types/trade";
import { TradePage } from "../components/trade-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("Trade") },
    {
      name: "description",
      content:
        "Trade leveraged long/short positions on model compute futures using $AUTO as collateral.",
    },
  ];
}

export default function Trade() {
  return <TradePage />;
}
