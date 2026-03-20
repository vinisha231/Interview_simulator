#!/bin/sh
set -e
cd /app
echo "Applying database migrations (alembic upgrade head)..."
alembic upgrade head
echo "Starting application..."
exec "$@"
