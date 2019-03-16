/**
 * @file Jest tests for treescheme/serializer.ts
 */

import * as TreeScheme from "../../../src/treescheme";
import * as Utils from "../../../src/utils";

test("savedJsonIsIdenticalToReadJson", () => {
    const json = Utils.formatJson(`{
        "rootAlias": "Alias",
        "aliases": [
            { "identifier": "Alias", "values": [ "NodeA", "NodeB" ] }
        ],
        "nodes": [
            {
                "nodeType": "NodeA",
                "fields": []
            },
            {
                "nodeType": "NodeB",
                "fields": [
                    { "name": "field1", "valueType": "Alias", "isArray": true },
                    { "name": "field2", "valueType": "boolean", "isArray": false},
                    { "name": "field3", "valueType": "string", "isArray": false},
                    { "name": "field4", "valueType": "number", "isArray": true }
                ]
            }
        ]
    }`);
    const parseResult = TreeScheme.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        const composedJson = TreeScheme.Serializer.composeJson(parseResult.value);
        expect(composedJson).toEqual(json);
    }
});
