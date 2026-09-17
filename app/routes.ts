import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("markets", "routes/markets.tsx"),
  route("roadmap", "routes/roadmap.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("staking", "routes/staking.tsx"),
  route("treasury", "routes/treasury.tsx"),
  route("earn", "routes/earn.tsx"),
] satisfies RouteConfig;
