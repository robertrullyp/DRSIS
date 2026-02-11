#!/usr/bin/env bash
set -euo pipefail

DEFAULT_DATABASE_URL="${DATABASE_URL:-mysql://sis:sis@127.0.0.1:3306/sis}"
E2E_DATABASE_URL="${E2E_DATABASE_URL:-$DEFAULT_DATABASE_URL}"
if [[ "$E2E_DATABASE_URL" != *"connect_timeout="* ]]; then
  if [[ "$E2E_DATABASE_URL" == *"?"* ]]; then
    E2E_DATABASE_URL="${E2E_DATABASE_URL}&connect_timeout=5"
  else
    E2E_DATABASE_URL="${E2E_DATABASE_URL}?connect_timeout=5"
  fi
fi
export E2E_DATABASE_URL
export DATABASE_URL="$E2E_DATABASE_URL"

ready=0
for attempt in $(seq 1 30); do
  if npx prisma db push --skip-generate --accept-data-loss >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" -ne 1 ]]; then
  echo "[e2e-webserver] Database not reachable at $E2E_DATABASE_URL"
  exit 1
fi

npx prisma generate >/dev/null
npm run db:seed >/dev/null

exec npm run dev -- -p 3000
