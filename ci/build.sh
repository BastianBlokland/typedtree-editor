#!/bin/bash
set -e
source ./ci/utils.sh

# Verify tooling
./ci/verify-tooling.sh

info "Compiling TypeScript"
./node_modules/.bin/tsc

info "Rolling up JavaScript"
./ci/rollup.sh

info "Copying assets"
cp -v -r ./assets/. ./build/

info "Setting Content-Security-Policy"
# Insert the csp element in all html files that hdefine a 'Content-Security-Policy' comment.
CSP_CONTENT="$(tail -c +4 < ./assets/csp.txt | tr -d '\n')";
CSP_ELEMENT='<meta http-equiv="Content-Security-Policy" content="'"$CSP_CONTENT"'">'
sed -i '' "/<!-- Content-Security-Policy -->/a\\
    \ \ $CSP_ELEMENT
    " ./build/*.html

info "Finished build"
exit 0
