#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Use rollup to combine all javascript files into a single entrypoint.
# --------------------------------------------------------------------------------------------------

# Verify tooling
./ci/verify-tooling.sh

info "Rolling up scripts"

# Package .js files
./node_modules/.bin/rollup -c

info "Finished rolling up scripts"
exit 0
