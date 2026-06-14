#!/bin/bash
set -e

# Instead of running on local machine, create EC2 instance on AWS w/c6i.2xlarge
# ssh -i temp5-acc.pem ec2-user@3.87.77.194
# 0) Create acc-copyback-{date} app in Flyio with 150GB for temp restore.
# 1) Install postgres: sudo dnf install -y postgresql17
# 2) Install fly: curl -L https://fly.io/install.sh | sh
# 3) Exit instance, reenter it. Then: Fly token for auth: export FLY_API_TOKEN=X
# 4) In one terminal, proxy prod: fly proxy 15432:5432 -a acc-db
# 5) In another terminal, dump prod: pg_dump "postgres://postgres:{PASSWORD}@localhost:15432/postgres" --format=custom --no-owner --no-acl --compress=0 -f acc.dump
# 6) In the first terminal, kill proxy to prod and open proxy to copyback: fly proxy 15433:5432 -a acc-copyback
# 7) In second terminal, restore to copyback: pg_restore --clean --if-exists --no-owner --no-acl --jobs=12 --dbname="postgres://postgres:{PASSWORD}@localhost:15433/postgres" acc.dump
# 8) Run locally through proxy: fly proxy 15433:5432 -a acc-copyback

DATABASE_URL_CLEAN="postgres://postgres:{PASSWORD}@localhost:15433/postgres"
DB_SCHEMA="public"

repo_base_path="$(pwd)/$(dirname $0)/.."

echo -e "Running ci scripts..."

# run scripts in db/ci folder
cd $repo_base_path/db/ci
for filename in *.sql; do
	[ -e "$filename" ] || continue
	echo -e "*** db/ci/$filename"
	psql "$DATABASE_URL_CLEAN" -v ON_ERROR_STOP=1 -f "$filename"
done

echo -e "Finished running ci scripts."

# 9) run in Git Bash with acc-copyback: npm run update-init-scripts
# 10) Exit instance. Terminate instance. Delete acc-copyback.
# 11) Move all but one in db/update to db/update_old.