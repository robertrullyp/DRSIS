#!/usr/bin/env bash
set -euo pipefail

E2E_DATABASE_URL="${E2E_DATABASE_URL:-mysql://sis:sis@127.0.0.1:3307/sis?connect_timeout=5}"
export E2E_DATABASE_URL
export DATABASE_URL="$E2E_DATABASE_URL"

docker compose -f docker-compose.e2e.yml up -d mariadb_e2e || true

ready=0
for attempt in $(seq 1 30); do
  if npx prisma db push --skip-generate >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" -ne 1 ]]; then
  echo "[e2e-webserver] Database not ready at $E2E_DATABASE_URL"
  exit 1
fi

npx prisma generate >/dev/null
npm run db:seed >/dev/null

exec npm run dev -- -p 3000
