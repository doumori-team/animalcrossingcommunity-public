#!/bin/bash

if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "staging" ]; then
	# heroku apps: accommunity-staging, animalcrossingcommunity
	./node_modules/@babel/cli/bin/babel.js src -d lib --copy-files --extensions ".js,.tsx,.ts,.jsx"
	./node_modules/sass/sass.js --style=compressed --no-source-map ./src/client/css/_main.scss ./lib/client/static/build.css
	./node_modules/sass/sass.js --style=compressed --no-source-map ./node_modules/yet-another-react-lightbox/dist/styles.css ./lib/client/static/vendor1.css
	./node_modules/sass/sass.js --style=compressed --no-source-map ./node_modules/yet-another-react-lightbox/dist/plugins/captions/captions.css ./lib/client/static/vendor2.css
	./node_modules/webpack-cli/bin/cli.js --mode=production
else
	# localhost or review apps
	./node_modules/typescript/bin/tsc
	./node_modules/@babel/cli/bin/babel.js src -d lib --copy-files --extensions ".js,.tsx,.ts,.jsx" --source-maps
	./node_modules/sass/sass.js ./src/client/css/_main.scss ./lib/client/static/build.css
	./node_modules/sass/sass.js ./node_modules/yet-another-react-lightbox/dist/styles.css ./lib/client/static/vendor1.css
	./node_modules/sass/sass.js ./node_modules/yet-another-react-lightbox/dist/plugins/captions/captions.css ./lib/client/static/vendor2.css
	./node_modules/webpack-cli/bin/cli.js --mode=development
fi