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

# O worker de filas é reiniciado se cair, como em produção (entrypoint.sh).
supervise_worker() {
  while true; do
    # set -e não pode encerrar o laço justamente quando o worker cai.
    code=0
    npm run work:all || code=$?
    echo "O worker de filas saiu (código $code). Reiniciando em 5s..." >&2
    sleep 5
  done
}
supervise_worker &
# Ctrl+C encerra o grupo inteiro: app, laço e worker.
trap 'trap - EXIT INT TERM; kill 0' EXIT INT TERM

npm run dev
