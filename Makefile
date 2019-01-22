.PHONY: clean build test watch
default: build

clean:
	./ci/clean.sh

build: clean
	./ci/build.sh

test:
	./ci/test.sh

watch:
	./ci/watch.sh
