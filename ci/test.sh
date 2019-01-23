#!/bin/bash
set -e

# Verify tooling
./ci/verify-tooling.sh

echo "INFO: Starting tests"
./node_modules/.bin/jest --coverage --reporters=jest-junit

echo "INFO: Finished tests"
exit 0
