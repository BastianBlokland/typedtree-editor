import * as Utils from "../src/utils";
import * as Tree from "../src/tree";
import * as TreeSerializer from "../src/treeserializer";
import * as Tree̦Parser from "../src/treeparser";

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
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        const composedJson = TreeSerializer.composeJson(nodeParseResult.value);
        expect(composedJson).toEqual(json);
    }
});

test("emptyArraysAreNotExported", () => {
    const node = Tree.createNode("root", b => b.pushNumberArrayField("field", []))

    const composedJson = TreeSerializer.composeJson(node);
    expect(composedJson).toEqual(Utils.formatJson(`{
        "$type": "root"
    }`));
});
