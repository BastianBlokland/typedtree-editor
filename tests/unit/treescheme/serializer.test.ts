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
        "enums": [
            { "identifier": "Enum", "values": [
                { "value": 0, "name": "A" }, { "value": 1, "name": "B" }
            ]}
        ],
        "nodes": [
            {
                "nodeType": "NodeA",
                "comment": "This is a useful node",
                "fields": []
            },
            {
                "nodeType": "NodeB",
                "fields": [
                    { "name": "field1", "valueType": "boolean" },
                    { "name": "field2", "valueType": "string" },
                    { "name": "field3", "valueType": "number", "isArray": true, "hideName": true },
                    { "name": "field4", "valueType": "Alias", "isArray": true },
                    { "name": "field5", "valueType": "Enum", "isArray": true }
                ]
            }
        ],
        "featureNodeNames": true
    }`);
    const parseResult = TreeScheme.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        const composedJson = TreeScheme.Serializer.composeJson(parseResult.value);
        expect(composedJson).toEqual(json);
    }
});
