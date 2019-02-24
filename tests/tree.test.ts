/**
 * @file Jest tests for tree.ts
 */

import * as Tree from "../src/tree";

test("cannotPushDuplicateField", () => {
    const result = Tree.createNode("root", b => {
        expect(b.pushBooleanField("testField", true)).toBeTruthy();
        expect(b.pushBooleanField("testField", false)).toBeFalsy();
    });
    expect(result.fields.length).toBe(1);

    const field = result.getField("testField");
    if (field !== undefined && field.kind === "boolean") {
        expect(field.value).toBeTruthy();
    } else {
        throw new Error("Field not found");
    }
});

test("getNodeCount", () => {
    const testTree = createTestTree();
    expect(Tree.getNodeCount(testTree)).toBe(10);
});

test("forEachDirectChild", () => {
    const testTree = createTestTree();
    const directChildTypes: string[] = [];
    Tree.forEachDirectChild(testTree, child => { directChildTypes.push(child.type); });

    expect(directChildTypes).toEqual(["node2", "node4"]);
});

test("getDirectChildren", () => {
    const testTree = createTestTree();
    const directChildTypes = Tree.getDirectChildren(testTree).map(child => child.type);

    expect(directChildTypes).toEqual(["node2", "node4"]);
});

test("getAllChildren", () => {
    const testTree = createTestTree();
    const allChildTypes = Tree.getAllChildren(testTree).map(child => child.type);

    expect(allChildTypes).toEqual([
        "node2",
        "node3",
        "node4",
        "node5",
        "node6",
        "node7",
        "node8",
        "node9",
        "node10"]);
});

test("fieldNames", () => {
    const testTree = createTestTree();

    expect(testTree.fieldNames).toEqual(["field1", "field3"]);
});

test("fieldTypes", () => {
    const testTree = createTestTree();
    const fieldValues = testTree.fields.map(field => field.kind);

    expect(fieldValues).toEqual(["nodeArray", "node"]);
});

function createTestTree(): Tree.INode {
    return Tree.createNode("node1", b => {
        b.pushNodeArrayField("field1", [
            Tree.createNode("node2", b => {
                b.pushNodeField("field2", Tree.createNode("node3"));
            }),
        ]);
        b.pushNodeField("field3", Tree.createNode("node4", b => {
            b.pushNodeArrayField("field3", [
                Tree.createNode("node5", b => {
                    b.pushNodeField("field4", Tree.createNode("node6"));
                    b.pushStringField("field5", "string");
                    b.pushNumberField("field6", 1337);
                    b.pushBooleanField("field7", true);
                }),
                Tree.createNode("node7", b => {
                    b.pushNodeField("field8", Tree.createNode("node8"));
                    b.pushStringArrayField("field9", ["string", "string2"]);
                    b.pushNumberArrayField("field10", [1337, 1338]);
                    b.pushBooleanArrayField("field11", [true, false]);
                }),
                Tree.createNode("node9", b => {
                    b.pushNodeField("anotherField", Tree.createNode("node10"));
                }),
            ]);
        }));
    });
}
