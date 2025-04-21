#!/bin/bash

if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "staging" ]; then
	# heroku apps: accommunity-staging, animalcrossingcommunity
	react-router build --mode $NODE_ENV
else
	# localhost or review apps
	react-router build --mode development
fi