import type { Route } from "./+types/derivatives";
import { DerivativesPage } from "../components/derivatives-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("Options & Derivatives") },
    {
      name: "description",
      content:
        "Options on AI compute — calls, puts, Greeks, and calendar spreads priced with Black-76 off the Auton yield curve.",
    },
  ];
}

export default function Derivatives() {
  return <DerivativesPage />;
}
