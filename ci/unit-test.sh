#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Run all unit-tests using jest and report results and coverage in various formats.
# --------------------------------------------------------------------------------------------------

# Verify tooling
./ci/verify-tooling.sh

info "Starting unit-tests"
./node_modules/.bin/jest \
    --config=jest.config.unit.js \
    --reporters=default \
    --reporters=jest-junit \
    --coverage \
    --coverageReporters=text \
    --coverageReporters=cobertura \
    --coverageReporters=html

if fileDoesNotExist "./junit.xml"
then
    fail "No 'junit.xml' output found"
fi

# Rename unit-test output to reflect that these are unit-test results.
mv -f "./junit.xml" "./test.unit.junit.xml"

info "Finished unit-tests"
exit 0
