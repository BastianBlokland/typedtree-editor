.PHONY: build
default: build

# --------------------------------------------------------------------------------------------------
# MakeFile used as a convient way for executing development utlitities.
# --------------------------------------------------------------------------------------------------

clean:
	./ci/clean.sh

build:
	./ci/build.sh

deploy: build
	./ci/deploy.sh

lint:
	./ci/lint.sh

test.unit:
	./ci/test.unit.sh

test.integration: build
	./ci/test.integration.sh

test: test.unit test.integration

watch:
	./ci/watch.sh

upgrade-dependencies:
	./ci/upgrade-dependencies.sh
