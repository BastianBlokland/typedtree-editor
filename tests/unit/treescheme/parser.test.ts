/**
 * @file Jest tests for treescheme/parser.ts
 */

import * as TreeScheme from "../../../src/treescheme";

test("basicSchemeIsParsedSuccessfully", () => {
    const json = `{
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
            { "nodeType": "NodeA" },
            {
                "nodeType": "NodeB",
                "comment": "This is a very useful node",
                "fields": [
                    { "name": "field1", "valueType": "boolean" },
                    { "name": "field2", "valueType": "string" },
                    { "name": "field3", "valueType": "number", "isArray": true },
                    { "name": "field4", "valueType": "Alias", "isArray": true },
                    { "name": "field5", "valueType": "Enum", "isArray": true }
                ]
            }
        ]
    }`;

    const parseResult = TreeScheme.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(TreeScheme.createScheme("Alias", b => {
            const alias = b.pushAlias("Alias", ["NodeA", "NodeB"]);
            const enumeration = b.pushEnum("Enum", [{ value: 0, name: "A" }, { value: 1, name: "B" }]);
            b.pushNodeDefinition("NodeA");
            b.pushNodeDefinition("NodeB", b => {
                b.comment = "This is a very useful node";
                b.pushField("field1", "boolean");
                b.pushField("field2", "string");
                b.pushField("field3", "number", true);
                b.pushField("field4", alias!, true);
                b.pushField("field5", enumeration!, true);
            });
        }));
    }
});

test("schemeCanBeParsedFromAnObject", () => {
    const obj = {
        rootAlias: "Alias",
        aliases: [
            { identifier: "Alias", values: ["NodeA"] },
        ],
        nodes: [
            { nodeType: "NodeA" },
        ],
    };

    const parseResult = TreeScheme.Parser.parseObject(obj);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(TreeScheme.createScheme("Alias", b => {
            b.pushAlias("Alias", ["NodeA"]);
            b.pushNodeDefinition("NodeA");
        }));
    }
});
