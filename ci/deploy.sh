#!/bin/bash
set -e

echo "INFO: Starting build"

# Run build
./ci/build.sh

echo "INFO: Starting upload"

# Sanity check existance of the azure cli tooling and the connection string
if [ ! -x "$(command -v az)" ]
then
    echo "ERROR: Azure cli 'az' is not installed"
    exit 1
fi
if [ ! -z "$1" ]
then
    echo "INFO: Using connection string from argument"
    AZURE_STORAGE_CONNECTION_STRING="$1"
    echo "Test: $1"
fi
if [ -z "$AZURE_STORAGE_CONNECTION_STRING" ]
then
    echo "ERROR: No connection string provided. Provide as arg or set 'AZURE_STORAGE_CONNECTION_STRING' environment variable"
    exit 1
fi

# Upload to azure cdn
az storage blob upload-batch \
    --source ./build \
    --destination \$web \
    --destination-path typedtree-editor \
    --content-cache-control "max-age=60" \
    --connection-string "$AZURE_STORAGE_CONNECTION_STRING"

echo "INFO: Finished deployment"
exit 0
