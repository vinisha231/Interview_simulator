#!/usr/bin/env bash
# Build the React app and copy it into backend/app/static for Elastic Beanstalk
# (FastAPI serves it from the same host as the API — use empty VITE_API_BASE_URL).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/frontend"

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

# Empty => browser calls /api/... on the same origin as the EB URL
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"

npm run build

STATIC_DEST="$ROOT/backend/app/static"
rm -rf "$STATIC_DEST"
mkdir -p "$STATIC_DEST"
cp -r "$ROOT/frontend/dist/"* "$STATIC_DEST/"

echo "Frontend copied to $STATIC_DEST (VITE_API_BASE_URL='${VITE_API_BASE_URL}')"
