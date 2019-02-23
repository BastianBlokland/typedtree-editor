.PHONY: build
default: build

# --------------------------------------------------------------------------------------------------
# MakeFile used as a convient way for executing development utlitities.
# --------------------------------------------------------------------------------------------------

clean:
	./ci/clean.sh

build: clean
	./ci/build.sh

deploy: clean
	./ci/deploy.sh

lint:
	./ci/lint.sh

test:
	./ci/test.sh

watch:
	./ci/watch.sh
