#!/usr/bin/env bash
# Prepara o ambiente de desenvolvimento: sobe MySQL/Redis, cria o .env,
# instala dependências e prepara o banco. Pode ser rodado de novo sem problema.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN="$ROOT/admin"
STORAGE="${NOMAD_STORAGE_PATH:-$HOME/nomad-storage}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Faltando: $1. $2" >&2; exit 1; }; }
need docker "Instale o Docker Desktop (Mac) ou Docker Engine (Linux)."
need node "Instale o Node.js 22 ou mais novo."
docker info >/dev/null 2>&1 || { echo "O Docker não está rodando. Abra o Docker Desktop e tente de novo." >&2; exit 1; }

node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 22 ] || { echo "Node $node_major encontrado; é preciso 22 ou mais novo." >&2; exit 1; }

echo "==> Subindo MySQL e Redis"
docker compose -f "$ROOT/dev/dev-services.yml" up -d --wait

echo "==> Configurando admin/.env"
mkdir -p "$STORAGE"
if [ ! -f "$ADMIN/.env" ]; then
  cp "$ADMIN/.env.example" "$ADMIN/.env"
  tmp="$(mktemp)"
  sed -e "s#^NOMAD_STORAGE_PATH=.*#NOMAD_STORAGE_PATH=$STORAGE#" "$ADMIN/.env" > "$tmp" && mv "$tmp" "$ADMIN/.env"
fi
grep -q '^URL=' "$ADMIN/.env" || printf '\nURL=http://localhost:8080\n' >> "$ADMIN/.env"

echo "==> Instalando dependências (pode demorar na primeira vez)"
cd "$ADMIN"
npm ci --no-audit --no-fund

if grep -qE '^APP_KEY=(some_random_key)?$' .env; then
  key="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
  tmp="$(mktemp)"
  sed -e "s#^APP_KEY=.*#APP_KEY=$key#" .env > "$tmp" && mv "$tmp" .env
fi

echo "==> Preparando o banco"
node ace migration:run --force
node ace db:seed

echo
echo "Pronto. Para rodar: ./dev/start.sh  e abra http://localhost:8080"
