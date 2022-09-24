/**
 * @file Jest tests for treescheme/serializer.ts
 */

import * as TreePack from "../../../src/treepack";
import * as Utils from "../../../src/utils";

test("savedJsonIsIdenticalToReadJson", () => {
    const json = Utils.formatJson(`{
        "scheme": {
            "rootAlias": "Alias",
            "aliases": [
                { "identifier": "Alias", "values": [ "NodeA" ] }
            ],
            "enums": [],
            "nodes": [
                {
                    "nodeType": "NodeA",
                    "fields": [
                        { "name": "field", "valueType": "boolean" }
                    ]
                }
            ],
            "featureNodeNames": true
        },
        "tree": {
            "$type": "NodeA",
            "field": true
        }
    }`);

    const parseResult = TreePack.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        const composedJson = TreePack.Serializer.composeJson(parseResult.value);
        expect(composedJson).toEqual(json);
    }
});
