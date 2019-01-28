#!/bin/bash
set -e

echo "INFO: Starting build"

# Run build
./ci/build.sh

echo "INFO: Starting minification"
./node_modules/.bin/uglifyjs --output ./build/bundle.js --compress --mangle -- ./build/bundle.js

echo "INFO: Starting deployment"

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

DEST_PATH="typedtree-editor/$1";

echo "INFO: Clearing destination"
az storage blob delete-batch \
    --source \$web \
    --pattern "$DEST_PATH/*" \
    --connection-string "$2"

echo "INFO: Upload to destination"
az storage blob upload-batch \
    --source ./build \
    --destination \$web \
    --destination-path "$DEST_PATH" \
    --content-cache-control "max-age=60" \
    --connection-string "$2"

echo "INFO: Finished deployment"
exit 0
