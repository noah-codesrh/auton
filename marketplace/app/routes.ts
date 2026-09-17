import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/home.tsx"),
    route("trade", "routes/trade.tsx"),
    route("yield-curve", "routes/yield-curve.tsx"),
    route("derivatives", "routes/derivatives.tsx"),
    route("indexes", "routes/indexes.tsx"),
    route("chat", "routes/chat.tsx"),
    route("models", "routes/models.tsx"),
    route("how-it-works", "routes/how-it-works.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
