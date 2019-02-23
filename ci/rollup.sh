#!/bin/bash
set -e
source ./ci/utils.sh

# Verify tooling
./ci/verify-tooling.sh

info "Rolling up scripts"

# Package .js files
./node_modules/.bin/rollup -c

info "Finished rolling up scripts"
exit 0
