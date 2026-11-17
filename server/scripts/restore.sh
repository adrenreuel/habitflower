#!/usr/bin/env bash
# Restore a backup: scripts/restore.sh habitflower-2026-11-15T030000Z.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
: "${1:?usage: restore.sh <backup file name>}"
aws s3 cp "${BACKUP_S3_URI}/$1" - | gunzip | docker compose exec -T db psql -U habitflower -d habitflower -v ON_ERROR_STOP=1
