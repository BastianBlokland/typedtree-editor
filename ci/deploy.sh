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
if [ -z "$1" ]
then
    echo "ERROR: No identifier provided. Provide as arg1"
    exit 1
fi
if [ -z "$2" ]
then
    echo "ERROR: No connection string provided. Provide as arg2"
    exit 1
fi

# Upload to azure cdn
az storage blob upload-batch \
    --source ./build \
    --destination \$web \
    --destination-path "typedtree-editor/$1" \
    --content-cache-control "max-age=60" \
    --connection-string "$2"

echo "INFO: Finished deployment"
exit 0
