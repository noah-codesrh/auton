import type { Route } from "./+types/dashboard";
import { DashboardPage } from "../components/dashboard-page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard — Auton" },
    {
      name: "description",
      content:
        "Manage API keys, forward compute balances, and gateway access for Auton agents.",
    },
  ];
}

export default function Dashboard() {
  return <DashboardPage />;
}
