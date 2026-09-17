import type { Route } from "./+types/treasury";
import { TreasuryPage } from "../components/treasury-page";
import { siteMeta } from "../lib/site-meta";

export function meta({}: Route.MetaArgs) {
  return siteMeta({
    title: "Treasury — Auton",
    description:
      "Live treasury stats for $AUTO — buybacks, burns, staker rewards, and supply metrics.",
    path: "/treasury",
  });
}

export default function Treasury() {
  return <TreasuryPage />;
}
