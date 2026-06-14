#!/bin/bash
set -e

echo "Running release.sh..."

if [ -z "$DATABASE_URL_CLEAN" ]; then
  echo "DATABASE_URL_CLEAN not set. Skipping release script."
  exit 0
fi

if [ -z "$DB_SCHEMA" ]; then
  echo "DB_SCHEMA not set. Skipping release script."
  exit 0
fi

repo_base_path="$(pwd)/$(dirname $0)/.."

if [ "$APP_NAME" = "animalcrossingcommunity" ]
then
    echo -e "Production, continuing on"
else
    echo -e "Resetting database..."
    # we are on a dev app or the staging app
    # delete database and restore from latest backup

    psql "$DATABASE_URL_CLEAN" -c "DROP SCHEMA IF EXISTS $DB_SCHEMA CASCADE;"
    psql "$DATABASE_URL_CLEAN" -c "CREATE SCHEMA $DB_SCHEMA;"

    echo -e "Running init script(s)..."

    cd $repo_base_path/db/init
    for filename in *.sql; do
      echo -e "*** db/init/$filename"
      sed -E "s/\bpublic\./$DB_SCHEMA./g" "$filename" \
        | psql "$DATABASE_URL_CLEAN" -v ON_ERROR_STOP=1
    done
fi

# get list of update scripts that have already been run
declare -A alreadyrun
for filename in $(psql -A -t -d "$DATABASE_URL_CLEAN" \
  -c "SET search_path TO $DB_SCHEMA; SELECT filename FROM _schema_updates;"); do
    alreadyrun[$filename]=1
done

# run any other scripts in db/update folder
cd $repo_base_path/db/update
for filename in *.sql; do
    [ -e "$filename" ] || continue
    [[ ${alreadyrun[$filename]} = 1 ]] && continue
    echo -e "*** db/update/$filename"

    psql "$DATABASE_URL_CLEAN" \
      -v ON_ERROR_STOP=1 \
      -c "SET search_path TO $DB_SCHEMA" \
      -f "$filename"

    psql "$DATABASE_URL_CLEAN" \
      -c "SET search_path TO $DB_SCHEMA; INSERT INTO _schema_updates(filename) VALUES ('$filename')" \
      --quiet
done

echo "Finished release.sh"