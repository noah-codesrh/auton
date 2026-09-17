import type { Route } from "./+types/models";
import { ModelsPage } from "../components/models-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("Models") },
    {
      name: "description",
      content:
        "Browse every model routable through the Auton gateway, with live OpenRouter pricing and context windows.",
    },
  ];
}

export default function Models() {
  return <ModelsPage />;
}
