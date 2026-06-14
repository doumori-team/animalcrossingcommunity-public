#!/bin/bash
set -euo pipefail

if [ -z "${PG_VOLUME_ID:-}" ]; then
  echo "PG_VOLUME_ID not set"
  exit 1
fi

if [ -z "${PG_APP_NAME:-}" ]; then
  echo "PG_APP_NAME not set"
  exit 1
fi

if [ -z "${FLY_API_TOKEN:-}" ]; then
  echo "FLY_API_TOKEN not set"
  exit 1
fi

echo "[$(date -u)] Creating Fly volume snapshot"

flyctl volumes snapshots create "$PG_VOLUME_ID" \
  --app "$PG_APP_NAME" \
  --access-token "$FLY_API_TOKEN"

echo "[$(date -u)] Snapshot complete"