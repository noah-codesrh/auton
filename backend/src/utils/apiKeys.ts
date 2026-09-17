import { createHash, randomBytes } from "node:crypto";

const API_KEY_PREFIX = "auton_sk_";

export function generateApiKey(): { plainKey: string; hash: string; prefix: string } {
  const secret = randomBytes(32).toString("hex");
  const plainKey = `${API_KEY_PREFIX}${secret}`;
  const hash = hashApiKey(plainKey);
  const prefix = `${plainKey.slice(0, 16)}...`;

  return { plainKey, hash, prefix };
}

export function hashApiKey(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

export function isAutonApiKey(value: string): boolean {
  return value.startsWith(API_KEY_PREFIX);
}
