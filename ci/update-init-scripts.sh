#!/bin/bash

# Produces a new set of init scripts from the most recent database backup.
# To be run by dev team leads from time to time.

if [ -z "$(which heroku)" ]
then
	echo "You need to install the Heroku CLI first."
	exit 1
fi

repo_base_path="$(pwd)/$(dirname $0)/.."

dropdb --if-exists acc2-tmp
createdb acc2-tmp
sudo -u postgres psql -d acc2-tmp -c 'CREATE SCHEMA IF NOT EXISTS heroku_ext'
heroku pg:backups:url --app acc-copyback \
	| xargs -n1 curl \
	| pg_restore -d acc2-tmp --no-owner

cd "$repo_base_path/db"
pg_dump -d acc2-tmp --no-owner > init/$(date +%F).sql
dropdb acc2-tmp