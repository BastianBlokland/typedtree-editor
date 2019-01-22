#!/bin/bash
set -e

# Verify tooling
./ci/verify-tooling.sh

echo "INFO: Starting tests"
./node_modules/.bin/jest --coverage

echo "INFO: Finished tests"
exit 0
