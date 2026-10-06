#!/usr/bin/env bash
# Sobe o app em modo dev (com hot reload) e os workers de fila juntos.
# Ctrl+C encerra os dois.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/admin"

[ -f .env ] || { echo "Rode ./dev/setup.sh primeiro." >&2; exit 1; }
docker compose -f "$ROOT/dev/dev-services.yml" up -d --wait >/dev/null

# O ace importa os comandos (e os jobs) antes de ler o .env, então o worker
# só enxerga o PMTILES_BIN se ele já estiver no ambiente do processo.
if [ -z "${PMTILES_BIN:-}" ]; then
  PMTILES_BIN="$(sed -n 's/^PMTILES_BIN=//p' .env | tail -n 1)"
  [ -n "$PMTILES_BIN" ] || { echo "PMTILES_BIN não está no admin/.env. Rode ./dev/setup.sh de novo." >&2; exit 1; }
  export PMTILES_BIN
fi

npm run work:all &
workers=$!
trap 'kill $workers 2>/dev/null || true' EXIT INT TERM

npm run dev
