import type { Route } from "./+types/how-it-works";
import { HowItWorksPage } from "../components/how-it-works-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("How it works") },
    {
      name: "description",
      content:
        "How Auton Futures works: connect a wallet, pay USDG, get credits, call the inference gateway.",
    },
  ];
}

export default function HowItWorks() {
  return <HowItWorksPage />;
}
