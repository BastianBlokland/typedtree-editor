#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Deploy a build and screenshots to a azure blob-storage bucket.
# --------------------------------------------------------------------------------------------------

BUILD_DIR="./build"
SCREENSHOT_DIR="./screenshots"
if [ ! -d "$BUILD_DIR" ]
then
    fail "No build directory found"
fi

info "Starting deployment"

# Why don't set the csp in the build step allready? Reason is that if we do we cannot use a local
# that injects JavaScript for hot-reload anymore.
if fileExists "./assets/csp.txt"
then
    info "Setting Content-Security-Policy"
    # Insert the csp element in all html files that hdefine a 'Content-Security-Policy' comment.
    # Note: Using 'tr' to strip the newlines
    CSP_CONTENT="$(tr '\n' ' ' < ./assets/csp.txt)";
    CSP_ELEMENT='<meta http-equiv="Content-Security-Policy" content="'"$CSP_CONTENT"'">'
    sed -i.backup -e "/<!-- Content-Security-Policy -->/a\\
        \ \ $CSP_ELEMENT
        " $BUILD_DIR/*.html
fi

info "Cleaning backup files"
rm -rf $BUILD_DIR/*.backup

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

function upload ()
{
    info "Uploading: '$1' to '$DEST_PATH/$2'"
    az storage blob upload-batch \
        --source "$1" \
        --destination \$web \
        --destination-path "$DEST_PATH/$2" \
        --content-cache-control "max-age=60" \
        --connection-string "$3"
}

# Upload build
upload "$BUILD_DIR" "/" "$2"
# Upload screenshots
if [ -d "$SCREENSHOT_DIR" ]
then
    upload "$SCREENSHOT_DIR" "/screenshots" "$2"
fi

info "Finished deployment"
exit 0
