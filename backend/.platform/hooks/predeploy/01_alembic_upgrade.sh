#!/bin/bash
set -euo pipefail
# AL2023: application is staged here before the version goes live.
cd /var/app/staging
python -m alembic upgrade head
