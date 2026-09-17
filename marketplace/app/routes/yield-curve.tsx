import type { Route } from "./+types/yield-curve";
import { YieldCurvePage } from "../components/yield-curve-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("Yield Curve") },
    {
      name: "description",
      content:
        "The yield curve for AI compute — the term structure of model inference prices across expiries, built live from the Auton futures market.",
    },
  ];
}

export default function YieldCurve() {
  return <YieldCurvePage />;
}
