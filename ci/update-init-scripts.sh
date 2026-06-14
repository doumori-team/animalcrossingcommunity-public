#!/bin/bash

# Produces a new set of init scripts from the most recent database backup.
# To be run by dev team leads from time to time.

set -e

DATABASE_URL="postgres://postgres:{PASSWORD}@localhost:15433/postgres"

repo_base_path="$(pwd)/$(dirname $0)/.."

cd "$repo_base_path/db"

echo "Dumping schema..."

pg_dump "$DATABASE_URL" --schema=public --no-owner --no-acl > init/$(date +%F).sql

echo "Done."