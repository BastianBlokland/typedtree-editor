#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Upgrade all npm dependencies to the latest.
# Avoids having to find the latest versions manually.
# Note: Please test very carefully if the new depedencies work. Here by dragons.
# --------------------------------------------------------------------------------------------------

# Verify tooling
./ci/verify-tooling.sh

info "Begin upgrading dependencies"
./node_modules/.bin/ncu -u

info "Updating npm"
npm update
npm install

info "Finished upgrading dependencies"
exit 0
