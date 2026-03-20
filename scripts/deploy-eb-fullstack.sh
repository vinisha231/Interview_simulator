#!/usr/bin/env bash
# Build frontend into backend/app/static, then deploy the backend to Elastic Beanstalk.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$ROOT/scripts/build-eb-frontend.sh"

cd "$ROOT/backend"
ENV_NAME="${EB_ENV_NAME:-interview-sim-env-3}"

EB_BIN="$(command -v eb || true)"
if [[ -z "$EB_BIN" && -x /opt/homebrew/bin/eb ]]; then
  EB_BIN=/opt/homebrew/bin/eb
fi
if [[ -z "$EB_BIN" ]]; then
  echo "eb CLI not found. Install: brew install aws-elasticbeanstalk" >&2
  exit 1
fi

exec "$EB_BIN" deploy "$ENV_NAME" "$@"
