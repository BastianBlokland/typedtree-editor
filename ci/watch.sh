#!/bin/bash
set -e

# Setup a trap to kill all subshells when the main command exits
trap 'kill 0' SIGINT EXIT

TEST_PORT="${TEST_PORT:-"8080"}"

# Verify tooling
./ci/verify-tooling.sh

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
    if [ ! -x "$(command -v rsync)" ]
    then
        echo "WARN: 'rsync' is not installed, skipping asset syncing"
        exit 0
    else
        echo "INFO: 'rsync' found, start asset syncing"
    fi

    while true;
    do
        rsync -r -u ./assets/* ./build/
        sleep 2
    done
}

# Start functions in subshells
autoCompileTypeScript & runDevelopmentWebServer & autoCopyAssets &

echo "INFO: Start watching (Serving at: $TEST_PORT)"

# Keep running until we receive user input
read line

# Stop (will kill the subshells because of the trap)
echo "INFO: Stopped watching"
exit 0
