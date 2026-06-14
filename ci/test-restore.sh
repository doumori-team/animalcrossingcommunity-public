#!/bin/bash
set -euo pipefail

# Instead of running on local machine, create EC2 instance on AWS w/c6i.2xlarge and S3EC2 IAM profile
# ssh -i X.pem ec2-user@Y
# 1) Install postgres: sudo dnf install -y postgresql17
# 2) Install fly: curl -L https://fly.io/install.sh | sh
# 3) Exit instance, reenter it. Then: Fly token for auth: export FLY_API_TOKEN=X
# 4) Create temporary fly postgres create
# 5) Proxy prod: fly proxy 15432:5432 -a acc-restore-test
# 6) Export: export DATABASE_URL="postgres://postgres:{PASSWORD}@localhost:15432/postgres"
# 7) LATEST=$(aws s3api list-objects-v2 --bucket animal-crossing-community --prefix backups-fly/ --query 'sort_by(Contents,&LastModified)[-1].Key' --output text)
# 8) Download it: aws s3 cp "s3://animal-crossing-community/$LATEST" acc.dump
# 9) Stream it: pg_restore --clean --if-exists --no-owner --no-privileges --jobs=12 --dbname="$DATABASE_URL" acc.dump
# 10) Confirm: psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
# 11) destroy app
# 12) Exit instance. Terminate instance.

DATABASE_URL=""

echo "Finding latest backup in S3..."

LATEST=$(aws s3api list-objects-v2 --bucket animal-crossing-community --prefix backups-fly/ --query 'sort_by(Contents,&LastModified)[-1].Key' --output text)

if [ -z "$LATEST_FILE" ]; then
  echo "No backups found"
  exit 1
fi

echo "Latest backup: $LATEST_FILE"

echo "Downloading it..."

aws s3 cp "s3://animal-crossing-community/$LATEST" acc.dump

echo "Starting restore..."

pg_restore --clean --if-exists --no-owner --no-privileges --jobs=12 --dbname="$DATABASE_URL" acc.dump

echo "Running sanity checks..."

psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

echo "[$(date -u)] Disaster recovery test completed successfully."