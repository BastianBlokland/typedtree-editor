/**
 * @file Jest tests for treescheme.serializer.ts
 */

import * as TreeSchemeParser from "../src/treescheme.parser";
import * as TreeSchemeSerializer from "../src/treescheme.serializer";
import * as Utils from "../src/utils";

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
    const parseResult = TreeSchemeParser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        const composedJson = TreeSchemeSerializer.composeJson(parseResult.value);
        expect(composedJson).toEqual(json);
    }
});
