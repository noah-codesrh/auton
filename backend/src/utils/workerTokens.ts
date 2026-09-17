import { createHash, randomBytes } from "node:crypto";

const WORKER_KEY_PREFIX = "auton_wk_";

export function generateWorkerToken(): {
  plainKey: string;
  hash: string;
  prefix: string;
} {
  const secret = randomBytes(32).toString("hex");
  const plainKey = `${WORKER_KEY_PREFIX}${secret}`;
  const hash = hashWorkerToken(plainKey);
  const prefix = `${plainKey.slice(0, 16)}...`;

  return { plainKey, hash, prefix };
}

export function hashWorkerToken(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

export function isAutonWorkerToken(value: string): boolean {
  return value.startsWith(WORKER_KEY_PREFIX);
}
