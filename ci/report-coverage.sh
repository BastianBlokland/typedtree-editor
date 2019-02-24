#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Report code-coverage to codecov.io.
# --------------------------------------------------------------------------------------------------

if [ -z "$1" ]
then
    fail "No codecov repository token provided. Provide as arg1"
fi

# Verify tooling
./ci/verify-tooling.sh

info "Start reporting coverage"

./node_modules/.bin/codecov -t "$1"

info "Finished reporting coverage"
exit 0
