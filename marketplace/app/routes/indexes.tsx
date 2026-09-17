import type { Route } from "./+types/indexes";
import { IndexesPage } from "../components/indexes-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("Indexes") },
    {
      name: "description",
      content:
        "Benchmarks for the machine economy — INF100 (the S&P 500 of AI compute), GPU500 supply health, and AGENT CPI, computed live from the Auton futures market.",
    },
  ];
}

export default function Indexes() {
  return <IndexesPage />;
}
