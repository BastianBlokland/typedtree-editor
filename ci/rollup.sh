#!/bin/bash
set -e

# Verify tooling
./ci/verify-tooling.sh

echo "INFO: Rolling up scripts"

# Package .js files
./node_modules/.bin/rollup -c

echo "INFO: Finished rolling up scripts"
exit 0
