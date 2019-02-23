#!/bin/bash
set -e
source ./ci/utils.sh

# Verify tooling
./ci/verify-tooling.sh

info "Starting tests"
./node_modules/.bin/jest \
    --reporters=default \
    --reporters=jest-junit \
    --coverage \
    --coverageReporters=text \
    --coverageReporters=cobertura \
    --coverageReporters=html

info "Finished tests"
exit 0
