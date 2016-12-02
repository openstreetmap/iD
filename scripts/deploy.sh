#/bin/bash

# This is an example script that shows how to pull the latest version
# of iD and replace the version string with a git short hash.
#
# We use this script to maintain the iD mirror at: http://openstreetmap.us/iD/master
# It runs via cron job every 15 minutes.
#
# To use this on your own site, you'll want to change the `cp` and `chgrp`
# lines at the end to match your web server's documentroot folder and security group.

git checkout -q master
git remote update > /dev/null

rev=`git rev-parse --short HEAD`
orig=`git rev-parse --short origin/master`
if [[ "${rev}" == "${orig}" ]] ; then
    exit 0
fi

git reset --hard HEAD
git pull origin master

rev=`git rev-parse --short HEAD`
sed -i "s/context.version = .*;/context.version = '${rev}';/" modules/core/context.js

npm prune
npm install
# npm run all

cp -Rf dist/* /var/www/openstreetmap.us/iD/master/
chgrp -R www-data /var/www/openstreetmap.us/iD/master/
