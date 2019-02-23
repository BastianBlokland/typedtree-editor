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

test:
	./ci/test.sh

watch:
	./ci/watch.sh
