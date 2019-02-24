/**
 * @file Jest tests for tree.serializer.ts
 */

import * as Tree from "../src/tree";
import * as Tree̦Parser from "../src/tree.parser";
import * as TreeSerializer from "../src/tree.serializer";
import * as Utils from "../src/utils";

test("savedJsonIsIdenticalToReadJson", () => {
    const json = Utils.formatJson(`{
        "$type": "root",
        "str": "string",
        "num": 42,
        "bool": true,
        "child": {
            "$type": "ChildType",
            "children": [{
                    "$type": "ChildType2",
                    "strAr": ["str1", "str2", "str3"],
                    "numAr": [1, 13, 133, 1337],
                    "boolAr": [true, false, true]
                }, {
                    "$type": "ChildType3"
                }
            ]
        }
    }`);
    const parseResult = Tree̦Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        const composedJson = TreeSerializer.composeJson(parseResult.value);
        expect(composedJson).toEqual(json);
    }
});

test("emptyArraysAreNotExported", () => {
    const node = Tree.createNode("root", b => b.pushNumberArrayField("field", []));

    const composedJson = TreeSerializer.composeJson(node);
    expect(composedJson).toEqual(Utils.formatJson(`{
        "$type": "root"
    }`));
});
