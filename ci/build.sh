#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Build the source code and assets into a distribution that can be deployed.
# --------------------------------------------------------------------------------------------------

# Verify tooling
./ci/verify-tooling.sh

info "Compiling TypeScript"
./node_modules/.bin/tsc

info "Rolling up JavaScript"
./ci/rollup.sh

info "Copying assets"
cp -v -r ./assets/. ./build/

if fileExists "./assets/style.css"
then
    info "Combining css"
    rm -rf ./build/*.css
    ./node_modules/.bin/css-combine "./assets/style.css" > "./build/style.css"
fi

if fileExists "./assets/csp.txt"
then
    info "Setting Content-Security-Policy"
    # Insert the csp element in all html files that hdefine a 'Content-Security-Policy' comment.
    # Note: Using 'tr' to strip the newlines
    CSP_CONTENT="$(tr '\n' ' ' < ./assets/csp.txt)";
    CSP_ELEMENT='<meta http-equiv="Content-Security-Policy" content="'"$CSP_CONTENT"'">'
    sed -i.backup -e "/<!-- Content-Security-Policy -->/a\\
        \ \ $CSP_ELEMENT
        " ./build/*.html
fi

info "Cleaning backup files"
rm -rf ./build/*.backup

info "Finished build"
exit 0
