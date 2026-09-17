import type { Route } from "./+types/earn";
import { EarnPage } from "../components/earn-page";
import { siteMeta } from "../lib/site-meta";

export function meta({}: Route.MetaArgs) {
  return siteMeta({
    title: "Earn — Worker Node | Auton",
    description:
      "Deploy an Auton provider node, contribute GPU compute, and earn USDC settlements.",
    path: "/earn",
  });
}

export default function Earn() {
  return <EarnPage />;
}
