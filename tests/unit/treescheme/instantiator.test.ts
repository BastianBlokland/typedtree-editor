/**
 * @file Jest tests for treescheme/instantiator.ts
 */

import * as Tree from "../../../src/tree";
import * as TreeScheme from "../../../src/treescheme";

test("missingFieldsAreAppendedCorrectly", () => {
    const scheme = createTestScheme();
    const tree = Tree.createNode("Node1", b => {
        b.pushName("MyNode");
        b.pushNumberField("field2", 1337);
        b.pushNodeArrayField("field9", [
            Tree.createNode("Node1", b => {
                b.pushStringArrayField("field6", ["elem1", "elem2"]);
            }),
        ]);
    });
    expect(TreeScheme.Instantiator.duplicateWithMissingFields(scheme, tree)).
        toEqual(Tree.createNode("Node1", b => {
            b.pushName("MyNode");
            b.pushStringField("field1", "");
            b.pushNumberField("field2", 1337);
            b.pushBooleanField("field3", false);
            b.pushNodeField("field4", Tree.createNoneNode());
            b.pushNumberField("field5", 1);
            b.pushStringArrayField("field6", []);
            b.pushNumberArrayField("field7", []);
            b.pushBooleanArrayField("field8", []);
            b.pushNodeArrayField("field9", [
                Tree.createNode("Node1", b => {
                    b.pushStringField("field1", "");
                    b.pushNumberField("field2", 0);
                    b.pushBooleanField("field3", false);
                    b.pushNodeField("field4", Tree.createNoneNode());
                    b.pushNumberField("field5", 1);
                    b.pushStringArrayField("field6", ["elem1", "elem2"]);
                    b.pushNumberArrayField("field7", []);
                    b.pushBooleanArrayField("field8", []);
                    b.pushNodeArrayField("field9", []);
                    b.pushNumberArrayField("field10", []);
                }),
            ]);
            b.pushNumberArrayField("field10", []);
        }));
});

test("nodeTypeCanBeChangedIntoNoneType", () => {
    const scheme = createTestScheme();
    const node = Tree.createNode("RandomNode", b => {
        b.pushNumberField("field1", 1234);
        b.pushNumberField("field2", 1337);
        b.pushNodeArrayField("field8", [
            Tree.createNode("Node1", b => {
                b.pushStringArrayField("field5", ["elem1", "elem2"]);
            }),
        ]);
    });
    expect(TreeScheme.Instantiator.changeNodeType(scheme, node, Tree.noneNodeType)).
        toEqual(Tree.createNoneNode());
});

test("whenChangingNodeTypeCompatibleFieldsAreReused", () => {
    const scheme = createTestScheme();
    const node = Tree.createNode("RandomNode", b => {
        b.pushName("My Node");
        b.pushNumberField("field1", 1234);
        b.pushNumberField("field2", 1337);
        b.pushNodeArrayField("field9", [
            Tree.createNode("Node1", b => {
                b.pushStringArrayField("field6", ["elem1", "elem2"]);
            }),
            Tree.createNoneNode(),
        ]);
    });
    expect(TreeScheme.Instantiator.changeNodeType(scheme, node, "Node1")).
        toEqual(Tree.createNode("Node1", b => {
            b.pushName("My Node");
            b.pushStringField("field1", "");
            b.pushNumberField("field2", 1337);
            b.pushBooleanField("field3", false);
            b.pushNodeField("field4", Tree.createNoneNode());
            b.pushNumberField("field5", 1);
            b.pushStringArrayField("field6", []);
            b.pushNumberArrayField("field7", []);
            b.pushBooleanArrayField("field8", []);
            b.pushNodeArrayField("field9", [
                Tree.createNode("Node1", b => {
                    b.pushStringArrayField("field6", ["elem1", "elem2"]);
                }),
                Tree.createNoneNode(),
            ]);
            b.pushNumberArrayField("field10", []);
        }));
});

test("noneNodesCanBeInstantiated", () => {
    const scheme = createTestScheme();
    expect(TreeScheme.Instantiator.instantiateDefaultNodeType(scheme, Tree.noneNodeType)).
        toEqual(Tree.createNoneNode());
});

test("defaultNodeCanBeCreatedSuccessfully", () => {
    const scheme = createTestScheme();
    expect(TreeScheme.Instantiator.instantiateDefaultNodeType(scheme, "Node1")).
        toEqual(Tree.createNode("Node1", b => {
            b.pushStringField("field1", "");
            b.pushNumberField("field2", 0);
            b.pushBooleanField("field3", false);
            b.pushNodeField("field4", Tree.createNoneNode());
            b.pushNumberField("field5", 1);
            b.pushStringArrayField("field6", []);
            b.pushNumberArrayField("field7", []);
            b.pushBooleanArrayField("field8", []);
            b.pushNodeArrayField("field9", []);
            b.pushNumberArrayField("field10", []);
        }));
});

test("newElementsCanBeCreated", () => {
    const scheme = createTestScheme();
    const node = scheme.nodes[0];
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field1")!.valueType)).toEqual("");
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field2")!.valueType)).toEqual(0);
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field3")!.valueType)).toEqual(false);
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field4")!.valueType)).toEqual(Tree.createNoneNode());
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field5")!.valueType)).toEqual(1);
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field6")!.valueType)).toEqual("");
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field7")!.valueType)).toEqual(0);
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field8")!.valueType)).toEqual(false);
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field9")!.valueType)).toEqual(Tree.createNoneNode());
    expect(TreeScheme.Instantiator.createNewElement(node.getField("field10")!.valueType)).toEqual(1);
});

function createTestScheme(): TreeScheme.IScheme {
    return TreeScheme.createScheme("Root", b => {
        b.allowFeatures(TreeScheme.Features.NodeNames);
        const alias = b.pushAlias("Root", ["Node1"]);
        const enumeration = b.pushEnum("Enum", [{ value: 1, name: "A" }, { value: 2, name: "B" }]);
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "number");
            b.pushField("field3", "boolean");
            b.pushField("field4", alias!);
            b.pushField("field5", enumeration!);
            b.pushField("field6", "string", true);
            b.pushField("field7", "number", true);
            b.pushField("field8", "boolean", true);
            b.pushField("field9", alias!, true);
            b.pushField("field10", enumeration!, true);
        });
    });
}
