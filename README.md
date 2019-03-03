# TypedTree-Editor

[![Build Status](https://dev.azure.com/bastian-blokland/TypedTree-Editor/_apis/build/status/BastianBlokland.typedtree-editor?branchName=master)](https://dev.azure.com/bastian-blokland/TypedTree-Editor/_build/latest?definitionId=3?branchName=master)
[![codecov](https://codecov.io/gh/BastianBlokland/typedtree-editor/branch/master/graph/badge.svg)](https://codecov.io/gh/BastianBlokland/typedtree-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Web editor for typed tree structures**](https://bastian.tech/tree/)

---
![Preview image](https://bastian.tech/tree/screenshots/toolbox-hidden.png)

---

## Description
This editor is designed to be able to build tree structures according to a scheme and then output it
to json. You create simple scheme file describing the possible node types, load it up in the editor
and then create tree's in a visual (and type safe) way.

Both the scheme and the tree formats are
designed to be both hand-editable and easy to generate / parse. You could for example generate a
scheme based on a class structure from the language you wish to load tree into.

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
* `nodes`: Definition of all the node-types in the scheme. Each node defines a type-name and a set
of fields that this node can have.

Possible field value types are:
* `boolean`
* `number`
* `string`
* `Alias` (Alias has to be defined in the `aliases` section of the scheme)

Currently only field types that are easily expressed in json are supported. I'm considering
adding more specialized types like `enum`, `int`, `float` etc, which would have their input filtered
accordingly.

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

## Ci
* [Azure ci](https://dev.azure.com/bastian-blokland/TypedTree-Editor/_build)
* Builds are pushed to: https://bastian.tech/typedtree-editor/refs/heads/[BRANCH_NAME]/

## Technologies
* [TypeScript](https://github.com/Microsoft/TypeScript)
* [TsLint](https://github.com/palantir/tslint)
* [Rollup](https://github.com/rollup/rollup)
* [Jest](https://github.com/facebook/jest)
* [FileSaver](https://github.com/eligrey/FileSaver.js)
* [uglify-js](https://github.com/mishoo/UglifyJS2)
* [css-combine](https://github.com/michaelrhodes/css-combine)
* [Npm](https://github.com/npm/cli)
* [live-server](https://github.com/tapio/live-server)
* [puppeteer](https://github.com/GoogleChrome/puppeteer)
