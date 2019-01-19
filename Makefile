.PHONY: build watch
default: build

build:
	./ci/build.sh

watch:
	./ci/watch.sh
