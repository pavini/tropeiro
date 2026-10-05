#!/usr/bin/env bash
# Sobe o app em modo dev (com hot reload) e os workers de fila juntos.
# Ctrl+C encerra os dois.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/admin"

[ -f .env ] || { echo "Rode ./dev/setup.sh primeiro." >&2; exit 1; }
docker compose -f "$ROOT/dev/docker-compose.yml" up -d --wait >/dev/null

npm run work:all &
workers=$!
trap 'kill $workers 2>/dev/null || true' EXIT INT TERM

npm run dev
