import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

if (!existsSync(envPath)) {
  console.error("No .env file found. Copy .env.example to .env and fill in values.");
  process.exit(1);
}

const production = [
  "NODE_ENV=production",
  "CORS_ORIGINS=https://autonairh.xyz,https://www.autonairh.xyz,https://app.autonairh.xyz",
];

const lines = readFileSync(envPath, "utf8").split("\n");
const vars = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;

  const key = trimmed.slice(0, eq).trim();
  if (key === "PORT" || key === "NODE_ENV" || key === "CORS_ORIGINS") continue;

  let value = trimmed.slice(eq + 1).trim();
  value = value.replace(/\s+/g, "");
  vars.push(`${key}=${value}`);
}

console.log("Paste the block below into Railway → service → Variables → Raw Editor:\n");
console.log("# Do NOT set PORT — Railway injects it automatically.\n");
console.log([...production, ...vars].join("\n"));
console.log("\n# After saving, deploy (or Redeploy). Check logs for [env] OK: on all 5 required vars.");
