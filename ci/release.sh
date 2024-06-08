#!/bin/bash

# This script runs on Heroku-hosted sites after source code has been copied to
# the server and dependencies have been fetched, but before Node starts up.

repo_base_path="$(pwd)/$(dirname $0)/.."

if [ "$HEROKU_APP_NAME" = "animalcrossingcommunity" ]
then
    #echo -e "Backing up production database..."
	# we are in production
	# back up database first in case everything goes horribly wrong
	#heroku pg:backups:capture DATABASE_URL --app animalcrossingcommunity
    echo -e "Production, continuing on"
else
    echo -e "Resetting database..."
	# we are on a review app or the staging app
	# delete database and restore from latest backup
	heroku pg:reset DATABASE_URL --app $HEROKU_APP_NAME \
		--confirm $HEROKU_APP_NAME

    echo -e "Adding heroku_ext..."
    psql -c 'CREATE SCHEMA IF NOT EXISTS heroku_ext' $DATABASE_URL

    # have only acc-copyback use production copy
    if [ "$HEROKU_APP_NAME" = "acc-copyback" ]
    then
        echo -e "Copying production database..."
        heroku pg:backups:url --app animalcrossingcommunity \
            | xargs -n1 curl \
            | pg_restore -d $DATABASE_URL --no-owner

        # run scripts in db/ci folder
        cd $repo_base_path/db/ci
        for filename in *.sql; do
            [ -e "$filename" ] || continue
            echo -e "*** db/ci/$filename"
            psql -d $DATABASE_URL -f "$filename"
        done
    else
        echo -e "Copying acc-copyback database..."
        heroku pg:backups:url --app acc-copyback \
            | xargs -n1 curl \
            | pg_restore -d $DATABASE_URL --no-owner
    fi
fi

# get list of update scripts that have already been run
declare -A alreadyrun
for filename in $(psql -A -t -d "$DATABASE_URL" -c "SELECT filename FROM _schema_updates;"); do
	alreadyrun[$filename]=1
done

# run any other scripts in db/update folder
cd $repo_base_path/db/update
for filename in *.sql; do
	[ -e "$filename" ] || continue
	[[ ${alreadyrun[$filename]} = 1 ]] && continue
	echo -e "*** db/update/$filename"
	psql -d $DATABASE_URL -f "$filename"
	psql -d $DATABASE_URL -c "INSERT INTO _schema_updates(filename) VALUES ('$filename')" --quiet
done

if [ "$HEROKU_APP_NAME" = "acc-copyback" ]
then
    echo -e "Creating backup of acc-copyback..."
    heroku pg:backups:capture --app acc-copyback
fi