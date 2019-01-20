.PHONY: clean build watch
default: build

clean:
	./ci/clean.sh

build: clean
	./ci/build.sh

watch:
	./ci/watch.sh
