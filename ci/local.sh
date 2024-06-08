#!/bin/bash

# This script runs on developers' local test environments when manually
# triggered.

script=`realpath $0`
script_path=`dirname $script`
repo_base_path="$script_path/.."
yellow=$(tput setaf 3)
blue=$(tput setaf 4)
normal=$(tput sgr0)

# parse command-line options
db_init=1
npm_install=1
verbose=0
compilers=1
server=1
eval set -- `getopt -o 'OIv' --long 'no-db-init,no-npm-install,verbose,no-compilers,no-server' -- "$@"`
while true; do
	case "$1" in
		'-O'|'--no-db-init') db_init=0; shift;;
		'-I'|'--no-npm-install') npm_install=0; shift;;
		'-v'|'--verbose') verbose=1; shift;;
		'-c'|'--no-compilers') compilers=0; shift;;
		'-s'|'--no-server') server=0; shift;;
		--) shift; break;;
		*) echo "Internal error with getopt" >&2; exit 3;;
	esac
done

# Sanity check
db_exists=$(psql -A -t -d template1 -c "SELECT COUNT(*) FROM pg_database WHERE datname='animalcrossingcommunity'")
if [ $db_init = 0 ] && [ $db_exists = 0 ]; then
	echo "${yellow}* Disregarding your instruction --no-db-init because there is no database yet${normal}"
	db_init=1
fi

# if command-line option --no-db-init is not set...
if [ $db_init = 1 ]; then
	# Create the database if it doesn't exist, or wipe it if it does
	if [ $db_exists = 0 ]; then
		echo "${blue}* Creating database${normal}"
		createdb animalcrossingcommunity
	else
		echo "${blue}* Wiping database${normal}"
		dropdb animalcrossingcommunity
		createdb animalcrossingcommunity
		# I feel like there ought to be a more elegant way of doing that?
	fi

	# run scripts in db/init folder
	cd "$repo_base_path/db/init"
	echo "${blue}* Running database init scripts${normal}"
	for filename in *.sql; do
		[ -e "$filename" ] || continue
		echo -e "  ${blue}*${normal} $filename"
		psql -d animalcrossingcommunity -f "$filename" &> /dev/null
	done
else
	echo "${blue}* Wiping database${normal} ...skipped"
	echo "${blue}* Running database init scripts${normal} ...skipped"
fi

# get list of update scripts that have already been run
declare -A alreadyrun
for filename in $(psql -A -t -d animalcrossingcommunity -c "SELECT filename FROM _schema_updates;"); do
	alreadyrun[$filename]=1
done

# run any other scripts in db/update folder
cd "$repo_base_path/db/update"
printf "${blue}* Running database update scripts${normal}"
scripts_run=0
for filename in *.sql; do
	[ -e "$filename" ] || continue
	[[ ${alreadyrun[$filename]} = 1 ]] && continue
	printf "\n  ${blue}*${normal} $filename"
	psql -d animalcrossingcommunity -f "$filename" --quiet
	psql -d animalcrossingcommunity -c "INSERT INTO _schema_updates(filename) VALUES ('$filename')" --quiet
	((scripts_run++))
done
if [ $scripts_run = 0 ]; then
	echo " ...skipped"
else
	echo
fi
cd "$repo_base_path"

# if command-line option --no-npm-install is not set...
if [ $npm_install = 1 ]; then
	# fetch dependencies
	echo "${blue}* Installing libraries from npm${normal}"
	rm -dr node_modules/
	if [ $verbose = 1 ]; then
		npm install --no-bin-links
	else
		npm install --no-bin-links --no-audit --loglevel=error
	fi
else
	echo "${blue}* Installing libraries from npm${normal} ...skipped"
fi

echo "${blue}* Clearing and Setting environment variables${normal}"

# see webpack.config.js for client-side local environment variables
# see heroku config vars for heroku environment variables
echo "DATABASE_URL=postgres://vagrant:ACCVagrantPostgresPassword@localhost/animalcrossingcommunity" > $repo_base_path/.env
echo "NODE_ENV=local" >> $repo_base_path/.env
echo "ACCOUNTS_API_KEY=REPLACEME" >> $repo_base_path/.env
echo "TEST_SITE_PASSWORD=REPLACEME" >> $repo_base_path/.env
echo "AWS_URL=https://dts8l1aj0iycv.cloudfront.net" >> $repo_base_path/.env
echo "HEROKU_APP_NAME=acc-test" >> $repo_base_path/.env

echo "PAYPAL_BUTTON_ID=RN59DNFQPMKHG" >> $repo_base_path/.env
echo "PAYPAL_MERCHANT_ID=WDGA2G3D6TBRL" >> $repo_base_path/.env

echo "AWS_BUCKET_REGION=us-east-1" >> $repo_base_path/.env
echo "AWS_ACCESS_KEY=REPLACEME" >> $repo_base_path/.env
echo "AWS_SECRET_KEY=REPLACEME" >> $repo_base_path/.env
echo "AWS_BUCKET_NAME=animalcrossingcommunity" >> $repo_base_path/.env

if [ $compilers = 1 ]; then
	echo "${blue}* Starting Babel, Sass & Webpack compilers${normal}"
	npm run build
else
	echo "${blue}* Starting Babel, Sass & Webpack compilers${normal} ...skipped"
fi

if [ $server = 1 ]; then
	echo "${blue}* Starting server${normal} (press Ctrl+C to quit)"
	heroku local web
else
	echo "${blue}* Starting server${normal} ...skipped"
fi