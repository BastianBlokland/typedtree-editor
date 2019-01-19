#!/bin/bash
set -e

# Require npm
if [ ! -x "$(command -v npm)" ]
then
    echo "ERROR: 'npm' is not installed"
    exit 1
else
    echo "INFO: 'npm' = '$(which npm)'"
fi

# Update npm if tooling is missing
checkNpmTooling ()
{
    if [ -f "./node_modules/.bin/tsc" ] && [ -f "./node_modules/.bin/rollup" ]
    then
        return 1
    fi
    return 0
}

if checkNpmTooling
then
    echo "INFO: Found missing tooling, running 'npm update'"
    npm update
fi

if checkNpmTooling
then
    echo "ERROR: Failed to install npm tooling"
    exit 1
fi

echo "INFO: Tooling verified"
exit 0
