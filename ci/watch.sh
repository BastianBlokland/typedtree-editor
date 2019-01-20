#!/bin/bash
set -e

TEST_PORT="${TEST_PORT:-"8080"}"

# Verify tooling
./ci/verify-tooling.sh

echo "INFO: Start watching (Serving at: $TEST_PORT)"

autoCompileTypeScript ()
{
    ./node_modules/.bin/tsc-watch --onSuccess ./ci/rollup.sh
}

runDevelopmentWebServer ()
{
    ./node_modules/.bin/live-server build --watch=./* --port=$TEST_PORT
}

autoCopyAssets ()
{
    while true;
    do
        rsync -r -u ./assets/* ./build/
        sleep 2
    done
}


# Setup a trap to stop the subshells when main command is terminated
trap 'kill %1; kill %2' SIGINT
# Start functions in subshells
autoCompileTypeScript & runDevelopmentWebServer & autoCopyAssets
