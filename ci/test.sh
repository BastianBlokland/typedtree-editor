#!/bin/bash
set -e

# Verify tooling
./ci/verify-tooling.sh

echo "INFO: Starting tests"
./node_modules/.bin/jest \
    --reporters=jest-junit \
    --coverage \
    --coverageReporters=text \
    --coverageReporters=cobertura \
    --coverageReporters=html

echo "INFO: Finished tests"
exit 0
