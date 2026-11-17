#!/usr/bin/env bash
# Nightly Postgres backup to S3. Run from cron on the EC2 host (see DEPLOY.md).
# Uses the instance role for S3 access; no keys on disk.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
: "${BACKUP_S3_URI:?set BACKUP_S3_URI in .env}"

stamp=$(date -u +%Y-%m-%dT%H%M%SZ)
file="habitflower-${stamp}.sql.gz"

docker compose exec -T db pg_dump -U habitflower -d habitflower --no-owner --clean --if-exists \
  | gzip -9 \
  | aws s3 cp - "${BACKUP_S3_URI}/${file}" --sse AES256 --only-show-errors

echo "$(date -u +%FT%TZ) backed up ${file}"
