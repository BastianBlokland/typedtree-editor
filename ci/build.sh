#!/bin/bash
set -e

# Verify tooling
./ci/verify-tooling.sh

echo "INFO: Compiling TypeScript"
./node_modules/.bin/tsc

echo "INFO: Rolling up JavaScript"
./ci/rollup.sh

echo "INFO: Copying assets"
cp -r ./assets/ ./build/

echo "INFO: Finished build"
exit 0
