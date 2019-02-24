#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Verify that all required tooling is available in the current environment.
# --------------------------------------------------------------------------------------------------

# Require npm and common unix commands
verifyCommand npm
verifyCommand cp
verifyCommand tr
verifyCommand sed
verifyCommand rm
verifyCommand rsync
verifyCommand lsof
verifyCommand grep
verifyCommand awk
verifyCommand xargs

# Update npm if tooling is missing
checkNpmTooling ()
{
    if  [ -f "./node_modules/.bin/tsc" ] &&
        [ -f "./node_modules/.bin/rollup" ] &&
        [ -f "./node_modules/.bin/jest" ] &&
        [ -f "./node_modules/.bin/uglifyjs" ] &&
        [ -f "./node_modules/.bin/codecov" ] &&
        [ -f "./node_modules/.bin/tslint" ]
    then
        return 1
    fi
    return 0
}

if checkNpmTooling
then
    info "Found missing tooling, running 'npm update'"
    npm update
fi

if checkNpmTooling
then
    fail "Failed to install npm tooling"
fi

info "Tooling verified"
exit 0
