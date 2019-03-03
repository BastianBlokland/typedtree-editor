#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Run all integration-tests using jest and report results.
# --------------------------------------------------------------------------------------------------

# Verify tooling
./ci/verify-tooling.sh

info "Starting integration-tests"

# Create directory for saving screenshots
rm -rf ./screenshots
mkdir "./screenshots"

./node_modules/.bin/jest \
    --runInBand \
    --config=jest.config.integration.js \
    --reporters=default \
    --reporters=jest-junit

if fileDoesNotExist "./junit.xml"
then
    fail "No 'junit.xml' output found"
fi

# Rename junit output to reflect that these are integration-test results.
mv -f "./junit.xml" "./test.integration.junit.xml"

info "Finished integration-tests"
exit 0
