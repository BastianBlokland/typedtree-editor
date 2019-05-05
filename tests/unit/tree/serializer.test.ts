/**
 * @file Jest tests for tree/serializer.ts
 */

import * as Tree from "../../../src/tree";
import * as Utils from "../../../src/utils";

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
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        const composedJson = Tree.Serializer.composeJson(parseResult.value);
        expect(composedJson).toEqual(json);
    }
});

test("emptyArraysAreNotSerialized", () => {
    const node = Tree.createNode("root", b => b.pushNumberArrayField("field", []));

    const composedJson = Tree.Serializer.composeJson(node);
    expect(composedJson).toEqual(Utils.formatJson(`{
        "$type": "root"
    }`));
});

test("anonymousTypeFieldsAreNotSerialized", () => {
    const node = Tree.createNode(Tree.anonymousNodeType, b => b.pushStringField("field", "test"));

    const composedJson = Tree.Serializer.composeJson(node);
    expect(composedJson).toEqual(Utils.formatJson(`{
        "field": "test"
    }`));
});

test("noneNodesFieldsAreNotSerialized", () => {
    const node = Tree.createNode("root", b => b.pushNodeField("field", Tree.createNoneNode()));

    const composedJson = Tree.Serializer.composeJson(node);
    expect(composedJson).toEqual(Utils.formatJson(`{
        "$type": "root"
    }`));
});

test("noneNodesAreFilteredOutOfNodeArrayFields", () => {
    const node = Tree.createNode("root", b => b.pushNodeArrayField("children", [
        Tree.createNode("test1"),
        Tree.createNoneNode(),
        Tree.createNode("test2"),
    ]));

    const composedJson = Tree.Serializer.composeJson(node);
    expect(composedJson).toEqual(Utils.formatJson(`{
        "$type": "root",
        "children": [
            { "$type": "test1" },
            { "$type": "test2" }
        ]
    }`));
});

test("noneRootNodeLeadsToEmptyJson", () => {
    const composedJson = Tree.Serializer.composeJson(Tree.createNoneNode());
    expect(composedJson).toEqual("");
});
