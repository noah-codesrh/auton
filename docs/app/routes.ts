import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("why-auton-matters", "routes/why-auton-matters.tsx"),
  route("economics", "routes/economics.tsx"),
  route("how-it-works", "routes/how-it-works.tsx"),
  route("architecture", "routes/architecture.tsx"),
  route("auto-token", "routes/auto-token.tsx"),
  route("staking", "routes/staking.tsx"),
  route("markets", "routes/markets.tsx"),
  route("trading", "routes/trading.tsx"),
  route("yield-curve", "routes/yield-curve.tsx"),
  route("derivatives", "routes/derivatives.tsx"),
  route("indexes", "routes/indexes.tsx"),
  route("chat", "routes/chat.tsx"),
  route("gateway", "routes/gateway.tsx"),
  route("agents", "routes/agents.tsx"),
  route("api", "routes/api.tsx"),
  route("user-guide", "routes/user-guide.tsx"),
  route("provider-guide", "routes/provider-guide.tsx"),
] satisfies RouteConfig;
