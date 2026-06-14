#!/bin/bash
set -euo pipefail

if [ -z "${DATABASE_URL_CLEAN:-}" ]; then
  echo "DATABASE_URL_CLEAN not set"
  exit 1
fi

if [ -z "${S3_BUCKET:-}" ]; then
  echo "S3_BUCKET not set"
  exit 1
fi

DATE=$(date -u +"%Y-%m-%d_%H-%M")
FILENAME="acc_${DATE}.dump"
DUMP_PATH="/data/acc_$(date +%F).dump"
S3_PATH="s3://${S3_BUCKET}/${FILENAME}"

echo "[$(date -u)] Starting backup"

set +e

pg_dump "$DATABASE_URL_CLEAN" --format=custom --no-owner --no-acl --compress=3 -f "$DUMP_PATH"
DUMP_EXIT=$?

echo "[$(date -u)] Starting copy to S3"
UPLOAD_EXIT=1

# Retry upload a few times in case of transient network issues
for i in 1 2 3; do
  echo "[$(date -u)] Upload attempt $i"

  aws s3 cp "$DUMP_PATH" "$S3_PATH" --endpoint-url "$AWS_ENDPOINT_URL_S3"

  UPLOAD_EXIT=$?

  if [ $UPLOAD_EXIT -eq 0 ]; then
    break
  fi

  echo "[$(date -u)] Upload attempt $i failed"
  sleep 10
done

echo "[$(date -u)] Deleting backup from tmp"

rm -f "$DUMP_PATH"

EXIT_CODE=$(( DUMP_EXIT || UPLOAD_EXIT ))

set -e

if [ $EXIT_CODE -ne 0 ]; then
  echo "[$(date -u)] Backup failed (dump=$DUMP_EXIT upload=$UPLOAD_EXIT)"

  if [ -n "${SENTRY_DSN:-}" ]; then
    sentry-cli send-event \
      -m "ACC backup failed (dump=$DUMP_EXIT upload=$UPLOAD_EXIT)" \
      --level=error || true
  fi

  exit 1
fi

echo "[$(date -u)] Backup complete → ${S3_PATH}"