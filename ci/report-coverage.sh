#!/bin/bash
set -e

# --------------------------------------------------------------------------------------------------
# Report code-coverage to codecov.io.
# --------------------------------------------------------------------------------------------------

if [ -z "$1" ]
then
    echo "ERROR: No codecov repository token provided. Provide as arg1"
    exit 1
fi

# Verify tooling
./ci/verify-tooling.sh

echo "INFO: Start reporting coverage"

./node_modules/.bin/codecov -t "$1"

echo "INFO: Finished reporting coverage"
exit 0
