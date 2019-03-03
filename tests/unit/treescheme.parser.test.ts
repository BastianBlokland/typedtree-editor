/**
 * @file Jest tests for treescheme.parser.ts
 */

import * as TreeScheme from "../../src/treescheme";
import * as Tree̦SchemeParser from "../../src/treescheme.parser";

test("basicSchemeIsParsedSuccessfully", () => {
    const json = `{
        "rootAlias": "Alias",
        "aliases": [
            { "identifier": "Alias", "values": [ "NodeA", "NodeB" ] }
        ],
        "nodes": [
            { "nodeType": "NodeA" },
            {
                "nodeType": "NodeB",
                "fields": [
                    { "name": "field1", "valueType": "Alias", "isArray": true },
                    { "name": "field2", "valueType": "boolean" },
                    { "name": "field3", "valueType": "string" },
                    { "name": "field4", "valueType": "number", "isArray": true }
                ]
            }
        ]
    }`;

    const parseResult = Tree̦SchemeParser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(TreeScheme.createScheme("Alias", b => {
            const alias = b.pushAlias("Alias", ["NodeA", "NodeB"]);
            b.pushNodeDefinition("NodeA");
            b.pushNodeDefinition("NodeB", b => {
                b.pushField("field1", alias!, true);
                b.pushField("field2", "boolean");
                b.pushField("field3", "string");
                b.pushField("field4", "number", true);
            });
        }));
    }
});
