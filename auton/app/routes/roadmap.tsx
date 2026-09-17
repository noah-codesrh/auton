import type { Route } from "./+types/roadmap";
import { Roadmap } from "../components/roadmap";
import { siteMeta } from "../lib/site-meta";

export function meta({}: Route.MetaArgs) {
  return siteMeta({
    title: "Roadmap — Auton",
    description:
      "The AUTON roadmap: from inference futures and yield curves to options, indexes, agent treasuries, resource-backed stablecoins, and a universal exchange for the machine economy.",
    path: "/roadmap",
  });
}

export default function RoadmapRoute() {
  return <Roadmap />;
}
