#!/bin/bash
set -e
source ./ci/utils.sh

info "Starting build"

# Run build
./ci/build.sh

info "Starting minification"
./node_modules/.bin/uglifyjs --output ./build/bundle.js --compress --mangle -- ./build/bundle.js

info "Starting deployment"

# Sanity check existance of the azure cli tooling and the connection string
verifyCommand az
if [ -z "$1" ]
then
    fail "No identifier provided. Provide as arg1"
fi
if [ -z "$2" ]
then
    fail "No connection string provided. Provide as arg2"
fi

DEST_PATH="typedtree-editor/$1";

info "Clearing destination"
az storage blob delete-batch \
    --source \$web \
    --pattern "$DEST_PATH/*" \
    --connection-string "$2"

info "Upload to destination"
az storage blob upload-batch \
    --source ./build \
    --destination \$web \
    --destination-path "$DEST_PATH" \
    --content-cache-control "max-age=60" \
    --connection-string "$2"

info "Finished deployment"
exit 0
