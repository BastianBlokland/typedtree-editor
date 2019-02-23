#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Run ts-lint linter over all of our TypeScript sourcefiles.
# --------------------------------------------------------------------------------------------------

# Verify tooling
./ci/verify-tooling.sh

info "Start linting"
./node_modules/.bin/tslint -c tslint.json 'src/**/*.ts' --format stylish

info "Linted succesfully"
exit 0
