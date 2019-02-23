.PHONY: build
default: build

clean:
	./ci/clean.sh

build: clean
	./ci/build.sh

deploy: clean
	./ci/deploy.sh

test:
	./ci/test.sh

watch:
	./ci/watch.sh
