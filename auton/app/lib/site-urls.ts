/**
 * Cross-app URLs. In `pnpm dev` these point at the sibling local servers;
 * production builds keep the public domains.
 */
const isDev = import.meta.env.DEV;

export const TRADE_APP_URL = isDev
  ? "http://localhost:5180"
  : "https://app.autonairh.xyz";

export const DOCS_URL = isDev
  ? "http://localhost:5174"
  : "https://docs.autonairh.xyz";
