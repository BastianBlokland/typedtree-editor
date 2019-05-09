/**
 * @file Jest tests for treepack/parser.ts
 */

import * as Tree from "../../../src/tree";
import * as TreePack from "../../../src/treepack";
import * as TreeScheme from "../../../src/treescheme";

test("basicTreePackIsParsedSuccessfully", () => {
    const json = `{
        "scheme": {
            "rootAlias": "Alias",
            "aliases": [
                { "identifier": "Alias", "values": [ "NodeA" ] }
            ],
            "nodes": [
                {
                    "nodeType": "NodeA",
                    "fields": [
                        { "name": "field", "valueType": "boolean" }
                    ]
                }
            ]
        },
        "tree": {
            "$type": "NodeA",
            "field": true
        }
    }`;

    const parseResult = TreePack.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(TreePack.createPack(
            TreeScheme.createScheme("Alias", b => {
                b.pushAlias("Alias", ["NodeA"]);
                b.pushNodeDefinition("NodeA", b => {
                    b.pushField("field", "boolean");
                });
            }),
            Tree.createNode("NodeA", b => {
                b.pushBooleanField("field", true);
            })));
    }
});
