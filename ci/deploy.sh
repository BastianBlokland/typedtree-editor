#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Minify and deploy a build to a azure blob-storage bucket.
# --------------------------------------------------------------------------------------------------

BUILD_DIR="./build"
if [ ! -d "$BUILD_DIR" ]
then
    fail "No build directory found"
fi

info "Starting minification"
./node_modules/.bin/uglifyjs \
    --output "$BUILD_DIR/bundle.js" --compress --mangle -- "$BUILD_DIR/bundle.js"

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
    --source "$BUILD_DIR" \
    --destination \$web \
    --destination-path "$DEST_PATH" \
    --content-cache-control "max-age=60" \
    --connection-string "$2"

info "Finished deployment"
exit 0
