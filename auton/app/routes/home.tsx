import type { Route } from "./+types/home";
import { Landing } from "../components/landing";
import { siteMeta } from "../lib/site-meta";

export function meta({}: Route.MetaArgs) {
  return siteMeta({
    title: "Auton — The CME for Machine Resources",
    description:
      "Trade, hedge, and secure future compute capacity directly from your Solana wallet. The liquidity venue for the machine economy.",
    path: "/",
  });
}

export default function Home() {
  return <Landing />;
}
