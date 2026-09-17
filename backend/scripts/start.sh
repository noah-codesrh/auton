#!/bin/sh
set -e

REQUIRED="
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
SOLANA_RPC_URL
MASTER_VAULT_WALLET
OPENROUTER_API_KEY
"

missing=0
for var in $REQUIRED; do
  eval "val=\${$var}"
  # Trim whitespace (Railway Raw Editor sometimes adds trailing spaces)
  val=$(printf '%s' "$val" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  if [ -z "$val" ]; then
    echo "[env] MISSING: $var"
    missing=1
  else
    echo "[env] OK: $var (${#val} chars)"
  fi
done

if [ "$missing" -eq 1 ]; then
  echo "[env] Railway context: RAILWAY_ENVIRONMENT=${RAILWAY_ENVIRONMENT:-unset} RAILWAY_SERVICE_NAME=${RAILWAY_SERVICE_NAME:-unset} PORT=${PORT:-unset}"
  echo "[env] Add variables on the auton-backend service → Variables → Raw Editor, then Redeploy."
  exit 1
fi

# JWT_SECRET must be at least 32 chars (matches src/config/env.ts)
eval "jwt=\${JWT_SECRET}"
jwt=$(printf '%s' "$jwt" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
if [ "${#jwt}" -lt 32 ]; then
  echo "[env] INVALID: JWT_SECRET must be at least 32 characters (got ${#jwt})"
  exit 1
fi

exec node dist/index.js
