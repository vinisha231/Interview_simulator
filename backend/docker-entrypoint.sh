#!/bin/sh
set -e
cd /app

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. In Elastic Beanstalk: Configuration → Software → Edit → Environment properties." >&2
  echo "Add DATABASE_URL (your RDS URL), apply, then redeploy." >&2
  exit 1
fi

echo "Applying database migrations (alembic upgrade head)..."
alembic upgrade head || {
  echo "ERROR: alembic upgrade head failed. If tables already exist but alembic_version is empty or behind, see README (Elastic Beanstalk / migrations)." >&2
  exit 1
}
echo "Starting application..."
exec "$@"
