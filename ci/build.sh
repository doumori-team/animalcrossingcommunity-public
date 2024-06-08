#!/bin/bash

if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "staging" ] || [ "$NODE_ENV" = "development" ]; then
	# heroku apps: accommunity-staging, animalcrossingcommunity, review apps
	./node_modules/@babel/cli/bin/babel.js src -d lib --copy-files
	./node_modules/sass/sass.js --style=compressed --no-source-map ./lib/client/css/_main.scss ./lib/client/static/build.css
	./node_modules/sass/sass.js --style=compressed --no-source-map ./node_modules/yet-another-react-lightbox/dist/styles.css ./lib/client/static/vendor1.css
	./node_modules/sass/sass.js --style=compressed --no-source-map ./node_modules/yet-another-react-lightbox/dist/plugins/captions/captions.css ./lib/client/static/vendor2.css
	./node_modules/webpack-cli/bin/cli.js --mode=production
else
	# localhost
	./node_modules/@babel/cli/bin/babel.js src -d lib --copy-files
	./node_modules/sass/sass.js ./lib/client/css/_main.scss ./lib/client/static/build.css
	./node_modules/sass/sass.js ./node_modules/yet-another-react-lightbox/dist/styles.css ./lib/client/static/vendor1.css
	./node_modules/sass/sass.js ./node_modules/yet-another-react-lightbox/dist/plugins/captions/captions.css ./lib/client/static/vendor2.css
	./node_modules/webpack-cli/bin/cli.js --mode=development
fi