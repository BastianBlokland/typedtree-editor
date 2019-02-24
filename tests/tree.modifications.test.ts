/**
 * @file Jest tests for tree.modifications.ts
 */

import * as Tree from "../src/tree";
import * as TreeModifications from "../src/tree.modifications";

test("fieldWithValueString", () => {
    const field: Tree.IStringField = { kind: "string", name: "testName", value: "oldValue" };
    expect(TreeModifications.fieldWithElement(field, "newValue"))
        .toEqual({ kind: "string", name: "testName", value: "newValue" });
});

test("fieldWithValueNumber", () => {
    const field: Tree.INumberField = { kind: "number", name: "testName", value: 1 };
    expect(TreeModifications.fieldWithElement(field, 2))
        .toEqual({ kind: "number", name: "testName", value: 2 });
});

test("fieldWithValueBoolean", () => {
    const field: Tree.IBooleanField = { kind: "boolean", name: "testName", value: false };
    expect(TreeModifications.fieldWithElement(field, true))
        .toEqual({ kind: "boolean", name: "testName", value: true });
});

test("fieldWithValueNode", () => {
    const field: Tree.INodeField = { kind: "node", name: "testName", value: Tree.createNode("old") };
    expect(TreeModifications.fieldWithElement(field, Tree.createNode("new")))
        .toEqual({ kind: "node", name: "testName", value: Tree.createNode("new") });
});

test("fieldWithValueStringArray", () => {
    const field: Tree.IStringArrayField = { kind: "stringArray", name: "testName", value: ["oldValue1", "oldValue2"] };
    expect(TreeModifications.fieldWithElement(field, "newValue", 1))
        .toEqual({ kind: "stringArray", name: "testName", value: ["oldValue1", "newValue"] });
});

test("fieldWithValueNumberArray", () => {
    const field: Tree.INumberArrayField = { kind: "numberArray", name: "testName", value: [1, 2, 3] };
    expect(TreeModifications.fieldWithElement(field, 1337, 0))
        .toEqual({ kind: "numberArray", name: "testName", value: [1337, 2, 3] });
});

test("fieldWithValueBooleanArray", () => {
    const field: Tree.IBooleanArrayField = { kind: "booleanArray", name: "testName", value: [true, false, true] };
    expect(TreeModifications.fieldWithElement(field, true, 1))
        .toEqual({ kind: "booleanArray", name: "testName", value: [true, true, true] });
});

test("fieldWithValueNodeArray", () => {
    const field: Tree.INodeArrayField = {
        kind: "nodeArray",
        name: "testName",
        value: [Tree.createNode("old1"), Tree.createNode("old2")],
    };
    expect(TreeModifications.fieldWithElement(field, Tree.createNode("new"), 0))
        .toEqual({ kind: "nodeArray", name: "testName", value: [Tree.createNode("new"), Tree.createNode("old2")] });
});

test("nodeWithField", () => {
    const node = Tree.createNode("testNode", b => {
        b.pushStringField("f1", "v1");
        b.pushStringField("f2", "v2");
    });
    expect(TreeModifications.nodeWithField(node, { kind: "string", name: "f2", value: "v3" }))
        .toEqual(Tree.createNode("testNode", b => {
            b.pushStringField("f1", "v1");
            b.pushStringField("f2", "v3");
        }));
});

test("treeWithReplacedNode", () => {
    const innerNodeA = Tree.createNode("innerNode", b => {
        b.pushStringField("innerFieldA", "innerValueA");
    });
    const innerNodeB = Tree.createNode("innerNode", b => {
        b.pushStringField("innerFieldB", "innerValueB");
    });
    const node = Tree.createNode("testNode", b => {
        b.pushNodeField("child", Tree.createNode("child", b => b.pushNodeField("grandChild", innerNodeA)));
    });
    expect(TreeModifications.treeWithReplacedNode(node, innerNodeA, innerNodeB))
        .toEqual(Tree.createNode("testNode", b => {
            b.pushNodeField("child", Tree.createNode("child", b => b.pushNodeField("grandChild", innerNodeB)));
        }));
});
