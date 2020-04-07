#!/bin/bash

# This script runs on TravisCI to push new translation strings to transifex

echo "TRAVIS=$TRAVIS"
echo "TRAVIS_PULL_REQUEST=$TRAVIS_PULL_REQUEST"
echo "TRAVIS_BRANCH=$TRAVIS_BRANCH"
echo "TRAVIS_NODE_VERSION=$TRAVIS_NODE_VERSION"

if [[ "$TRAVIS" != "true" ]]; then exit 0; fi
if [[ "$TRAVIS_PULL_REQUEST" != "false" ]]; then exit 0; fi
if [[ "$TRAVIS_BRANCH" != "develop" ]]; then exit 0; fi
if [[ "$TRAVIS_NODE_VERSION" != "10" ]]; then exit 0; fi

echo "Pushing source strings to Transifex..."
pip install virtualenv
virtualenv ~/env
source ~/env/bin/activate
pip install transifex-client
sudo echo $'[https://www.transifex.com]\nhostname = https://www.transifex.com\nusername = '"$TRANSIFEX_USER"$'\npassword = '"$TRANSIFEX_PASSWORD"$'\n' > ~/.transifexrc
tx push -s
