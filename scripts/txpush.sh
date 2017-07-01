#/bin/bash

# This script runs on TravisCI to push new translation strings to transifex

echo $"TRAVIS"
echo $"TRAVIS_PULL_REQUEST"
echo $"TRAVIS_BRANCH"

if [[ "$TRAVIS" != "true" -o $"TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "master" ]]; then exit 0; fi

echo "Pushing source strings to Transifex..."
pip install virtualenv
virtualenv ~/env
source ~/env/bin/activate
pip install transifex-client
sudo echo $'[https://www.transifex.com]\nhostname = https://www.transifex.com\nusername = '"$TRANSIFEX_USER"$'\npassword = '"$TRANSIFEX_PASSWORD"$'\n' > ~/.transifexrc
tx push -s
