#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Clean previous build output.
# --------------------------------------------------------------------------------------------------

# Remove all previous build artifacts
rm -rf ./build
rm -rf ./tsout

# Remove all test output files
rm -rf ./coverage
rm -rf ./tmp
rm -rf ./screenshots
rm -f ./*.junit.xml
rm -f ./junit.xml

exit 0
