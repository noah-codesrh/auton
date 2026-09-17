import type { Route } from "./+types/staking";
import { StakingPage } from "../components/staking-page";
import { siteMeta } from "../lib/site-meta";

export function meta({}: Route.MetaArgs) {
  return siteMeta({
    title: "Stake $AUTO — Auton",
    description:
      "Stake $AUTO in your own on-chain vault. Earn USDC rewards. Self-custody staking powered by Streamflow.",
    path: "/staking",
  });
}

export default function Staking() {
  return <StakingPage />;
}
