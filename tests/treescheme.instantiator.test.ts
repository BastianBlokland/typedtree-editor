/**
 * @file Jest tests for treescheme.instantiator.ts
 */

import * as Tree from "../src/tree";
import * as TreeScheme from "../src/treescheme";
import * as TreeSchemeInstantiator from "../src/treescheme.instantiator";

test("missingFieldsAreAppendedCorrectly", () => {
    const scheme = createTestScheme();
    const tree = Tree.createNode("Node1", b => {
        b.pushNumberField("field2", 1337);
        b.pushNodeArrayField("field8", [
            Tree.createNode("Node1", b => {
                b.pushStringArrayField("field5", ["elem1", "elem2"]);
            }),
        ]);
    });
    expect(TreeSchemeInstantiator.duplicateWithMissingFields(scheme, tree)).
        toEqual(Tree.createNode("Node1", b => {
            b.pushStringField("field1", "");
            b.pushNumberField("field2", 1337);
            b.pushBooleanField("field3", false);
            b.pushNodeField("field4", Tree.createNoneNode());
            b.pushStringArrayField("field5", []);
            b.pushNumberArrayField("field6", []);
            b.pushBooleanArrayField("field7", []);
            b.pushNodeArrayField("field8", [
                Tree.createNode("Node1", b => {
                    b.pushStringField("field1", "");
                    b.pushNumberField("field2", 0);
                    b.pushBooleanField("field3", false);
                    b.pushNodeField("field4", Tree.createNoneNode());
                    b.pushStringArrayField("field5", ["elem1", "elem2"]);
                    b.pushNumberArrayField("field6", []);
                    b.pushBooleanArrayField("field7", []);
                    b.pushNodeArrayField("field8", []);
                }),
            ]);
        }));
});

test("defaultNodeCanBeCreatedSuccessfully", () => {
    const scheme = createTestScheme();
    expect(TreeSchemeInstantiator.instantiateDefaultNode(scheme.nodes[0])).
        toEqual(Tree.createNode("Node1", b => {
            b.pushStringField("field1", "");
            b.pushNumberField("field2", 0);
            b.pushBooleanField("field3", false);
            b.pushNodeField("field4", Tree.createNoneNode());
            b.pushStringArrayField("field5", []);
            b.pushNumberArrayField("field6", []);
            b.pushBooleanArrayField("field7", []);
            b.pushNodeArrayField("field8", []);
        }));
});

function createTestScheme(): TreeScheme.IScheme {
    return TreeScheme.createScheme("Root", b => {
        const alias = b.pushAlias("Root", ["Node1"]);
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "number");
            b.pushField("field3", "boolean");
            b.pushField("field4", alias!);
            b.pushField("field5", "string", true);
            b.pushField("field6", "number", true);
            b.pushField("field7", "boolean", true);
            b.pushField("field8", alias!, true);
        });
    });
}