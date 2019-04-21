# TypedTree-Editor

[![Website](https://img.shields.io/website/https/bastian.tech/tree.svg)](https://bastian.tech/tree/)
[![Build](https://img.shields.io/azure-devops/build/bastian-blokland/TypedTree/3/master.svg)](https://dev.azure.com/bastian-blokland/TypedTree/_build/latest?definitionId=3&branchName=master)
[![Tests](https://img.shields.io/azure-devops/tests/bastian-blokland/TypedTree/3/master.svg)](https://dev.azure.com/bastian-blokland/TypedTree/_build/latest?definitionId=3&branchName=master)
[![CodeCov](https://codecov.io/gh/BastianBlokland/typedtree-editor/branch/master/graph/badge.svg)](https://codecov.io/gh/BastianBlokland/typedtree-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Web editor for typed tree structures**](https://bastian.tech/tree/)

---
![Preview image](https://bastian.tech/tree/screenshots/toolbox-hidden.png)

---

## Generators
To avoid having to hand write the scheme you can use one of the following generators:

| Environment | Generator |
|-------------|-----------|
| dotnet | [typedtree-generator-dotnet](https://github.com/bastianblokland/typedtree-generator-dotnet) |
| unity | [typedtree-generator-unity](https://github.com/bastianblokland/typedtree-generator-unity) |

## Description
This editor is designed to be able to build tree structures according to a scheme and then output it
to json. You create a simple scheme file describing the possible node types, load it up in the editor
and then create tree's in a visual (and type safe) way.

Both the scheme and the tree formats are
designed to be both hand-editable and easy to generate / parse. You could for example generate a
scheme based on a class structure from the language you wish to load tree into.

This editor runs purely client-side and any content you load into it stays purely on your machine.

### Example of the scheme format
```json
{
  "rootAlias": "AI.Item",
  "aliases": [
    {
      "identifier": "AI.Item",
      "values": [
        "AI.Items.Selector",
        "AI.Conditions.OutOfHealth"
      ]
    }
  ],
  "enums": [
    {
      "identifier": "AI.Target",
      "values": [
        { "value": 1, "name": "Ground" }
        { "value": 2, "name": "Air" }
      ]
    }
  ],
  "nodes": [
    {
      "nodeType": "AI.Items.Selector",
      "fields": [
        {
          "name": "children",
          "valueType": "AI.Item",
          "isArray": true
        }
      ]
    },
    {
      "nodeType": "AI.Conditions.OutOfHealth",
      "fields": [
        {
          "name": "minHealth",
          "valueType": "number"
        }
      ]
    }
  ]
}
```
Elements in the scheme:
* `rootAlias`: Alias that the root-node has to be part of.
* `aliases`: Definition of all the aliases in the scheme. An alias is a named group of node types.
* `enums`: Definition of all the enums in the scheme. An enum is a named set of numbers.
* `nodes`: Definition of all the node-types in the scheme. Each node defines a type-name and a set
of fields that this node can have.

Possible field value types are:
* `boolean`
* `number`
* `string`
* `Alias` (Alias has to be defined in the `aliases` section of the scheme)
* `Enum` (Enum has to be defined in the `enums` section of the scheme)

Enums are a special type as they only live in the scheme, in the actual tree data they are represented
by numbers. The fact that the field is an enum in the scheme will make the editor validate the number
and show it as a dropdown in the ui.

### Example of the tree output format
```json
{
  "$type": "AI.Items.Selector",
  "children": [
    {
      "$type": "AI.Conditions.OutOfHealth",
      "minHealth": 10
    }
  ]
}
```
Format is plain json with the exception of the `$type` property which indicates from which type in
the scheme this node was created from.

## Project setup
This project is written in [TypeScript](https://github.com/Microsoft/TypeScript) and is transpiled
into es5 JavaScript. Tree is rendered with a combination of plain html and svg.

For dependency management [Npm](https://github.com/npm/cli) is used.
[Rollup](https://github.com/rollup/rollup) is used for creating the output bundle, and deployments
are minified using [uglify-js](https://github.com/mishoo/UglifyJS2) and
[css-combine](https://github.com/michaelrhodes/css-combine).

Any ide can be used of course but configuration files for [vscode](https://github.com/Microsoft/vscode)
are included. Ci scripts are written in bash so windows users should use the
[wsl](https://docs.microsoft.com/en-us/windows/wsl) for running them.

### Building
Installing [node](https://nodejs.org/en/download/) and executing: `make` should be enough, build-output
can be found in the `./build` directory.

### Development
For local development execute: `make watch` which will start a local [server](https://github.com/tapio/live-server)
with hot-reloading.

### Run linter
For running the [tslint](https://github.com/palantir/tslint) linter you can execute: `make lint` but
when using vscode the tslint plugin should provide warnings for non-compliant code already.

### Unit tests
Unit tests can be found in `./tests/unit` and are using the [Jest](https://github.com/facebook/jest)
framework. Run unit-tests by executing: `make test.unit`.

Code coverage for unit-tests is tracked with [codecov.io](https://codecov.io/gh/BastianBlokland/typedtree-editor).

### Integration tests
Integration tests can be found in `./tests/integration`. Integration test are also written with
[Jest](https://github.com/facebook/jest) and are run in the [puppeteer](https://github.com/GoogleChrome/puppeteer)
environment (which is a headless chromium api) using
[jest-puppeteer](https://github.com/smooth-code/jest-puppeteer). Run integration-tests by executing:
`make test.integration`.

To make debugging easier screenshots are exported during integration test execution, they can be
found in the `./screenshots` directory. Actually the image in this readme also comes from there.

### Continuous integration
Builds are run in [azure-devops](https://dev.azure.com/bastian-blokland/TypedTree/_build?definitionId=3) and
output is deployed to a azure blob-storage bucket. Output can be found here:
`bastian.tech/typedtree-editor/refs/heads/[BRANCH_NAME]/`

`bastian.tech/tree` is a alias
to `bastian.tech/typedtree-editor/refs/heads/master/`

### Dependencies
* [FileSaver](https://github.com/eligrey/FileSaver.js): Library for saving files that works
consistently in almost all browsers.

## Troubleshooting
* If `verify-tooling.sh` fails try removing the `./node_modules` directory.

## Known issues
* Running the integration tests in the windows linux subsystem fails with `Error: Failed to launch chrome!`
This is a known puppeteer [issue](https://github.com/GoogleChrome/puppeteer/issues/1837)
