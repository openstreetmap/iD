#!/bin/bash

# This is an example script that shows how to pull the latest version
# of iD and replace the version string with a git short hash.
#
# We use this script to maintain the iD mirror at: http://preview.ideditor.com/master
# It runs via cron job every 10 minutes.
#
# To use this on your own site, you'll want to change the `cp` and `chgrp`
# lines at the end to match your web server's documentroot folder and security group.

git checkout -q develop
git remote update > /dev/null

rev=`git rev-parse --short HEAD`
orig=`git rev-parse --short origin/develop`

# pull latest code
if [[ "${rev}" != "${orig}" ]] ; then
  # avoid issues with local untracked locale files
  rm -f dist/locales/*.json
  git reset --hard HEAD
  git pull origin develop

  rev=`git rev-parse --short HEAD`
  sed -i "s/context.version = .*;/context.version = '${rev}';/" modules/core/context.js

  npm prune
  npm install > /dev/null 2>&1
fi

# pull latest imagery
rm -rf node_modules/editor-layer-index/
git clone https://github.com/osmlab/editor-layer-index.git node_modules/editor-layer-index > /dev/null 2>&1
rm -rf node_modules/editor-layer-index/.git/

# build everything
npm run imagery
npm run all

# pull latest translations
if [[ -f transifex.auth ]] ; then
  npm run translations
fi

cp -Rf dist/* /var/www/openstreetmap.us/iD/master/
chgrp -R www-data /var/www/openstreetmap.us/iD/master/
