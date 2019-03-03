#!/bin/bash
set -e
source ./ci/utils.sh

# --------------------------------------------------------------------------------------------------
# Build the source code and assets into a distribution that can be deployed.
# --------------------------------------------------------------------------------------------------

BUILD_DIR="./build"

# Clean build dir
rm -rf "$BUILD_DIR"

# Verify tooling
./ci/verify-tooling.sh

info "Compiling TypeScript"
./node_modules/.bin/tsc

info "Rolling up JavaScript"
./ci/rollup.sh

info "Copying assets"
cp -v -r ./assets/. "$BUILD_DIR/"

if fileExists "./assets/style.css"
then
    info "Combining css"
    rm -rf ./build/*.css
    ./node_modules/.bin/css-combine "./assets/style.css" > "$BUILD_DIR/style.css"
fi

info "Minify JavaScript bundle"
./node_modules/.bin/uglifyjs \
    --output "$BUILD_DIR/bundle.js" --compress --mangle \
    reserved=["getCurrentSchemeJson","getCurrentTreeJson"] \
    -- "$BUILD_DIR/bundle.js"

info "Finished build"
exit 0
