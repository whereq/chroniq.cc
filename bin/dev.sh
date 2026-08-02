#!/usr/bin/env bash
# =============================================================================
# chroniq.cc — bring up the local dev stack
# =============================================================================
# Ensures the shared whereq-db + the "chroniq" database exist, then starts the
# api + frontend dev containers with hot reload.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE="${ROOT}/docker/docker-compose.dev.yml"
DB_USER="${POSTGRES_USER:-flowdesk}"
CHRONIQ_DB="${CHRONIQ_DB:-chroniq}"

echo "▶ Ensuring '${CHRONIQ_DB}' database exists in whereq-db..."
if docker ps --format '{{.Names}}' | grep -q '^whereq-db$'; then
    docker exec whereq-db psql -U "${DB_USER}" -tc \
        "SELECT 1 FROM pg_database WHERE datname='${CHRONIQ_DB}'" | grep -q 1 || \
        docker exec whereq-db createdb -U "${DB_USER}" "${CHRONIQ_DB}"
    echo "✔ Database ready"
else
    echo "⚠ whereq-db is not running. Start the shared postgres compose first."
fi

echo "▶ Starting chroniq dev stack..."
docker compose -f "${COMPOSE}" up -d --build
echo "✔ API:      http://localhost:8000/docs"
echo "✔ Frontend: http://localhost:5173"
