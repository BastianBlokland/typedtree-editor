/**
 * @file Jest tests for tree/modifications.ts
 */

import * as Tree from "../../../src/tree";

test("fieldWithValueString", () => {
    const field: Tree.IStringField = { kind: "string", name: "testName", value: "oldValue" };
    expect(Tree.Modifications.fieldWithElement(field, "newValue"))
        .toEqual({ kind: "string", name: "testName", value: "newValue" });
});

test("fieldWithValueNumber", () => {
    const field: Tree.INumberField = { kind: "number", name: "testName", value: 1 };
    expect(Tree.Modifications.fieldWithElement(field, 2))
        .toEqual({ kind: "number", name: "testName", value: 2 });
});

test("fieldWithValueBoolean", () => {
    const field: Tree.IBooleanField = { kind: "boolean", name: "testName", value: false };
    expect(Tree.Modifications.fieldWithElement(field, true))
        .toEqual({ kind: "boolean", name: "testName", value: true });
});

test("fieldWithValueNode", () => {
    const field: Tree.INodeField = { kind: "node", name: "testName", value: Tree.createNode("old") };
    expect(Tree.Modifications.fieldWithElement(field, Tree.createNode("new")))
        .toEqual({ kind: "node", name: "testName", value: Tree.createNode("new") });
});

test("fieldWithValueStringArray", () => {
    const field: Tree.IStringArrayField = { kind: "stringArray", name: "testName", value: ["oldValue1", "oldValue2"] };
    expect(Tree.Modifications.fieldWithElement(field, "newValue", 1))
        .toEqual({ kind: "stringArray", name: "testName", value: ["oldValue1", "newValue"] });
});

test("fieldWithValueNumberArray", () => {
    const field: Tree.INumberArrayField = { kind: "numberArray", name: "testName", value: [1, 2, 3] };
    expect(Tree.Modifications.fieldWithElement(field, 1337, 0))
        .toEqual({ kind: "numberArray", name: "testName", value: [1337, 2, 3] });
});

test("fieldWithValueBooleanArray", () => {
    const field: Tree.IBooleanArrayField = { kind: "booleanArray", name: "testName", value: [true, false, true] };
    expect(Tree.Modifications.fieldWithElement(field, true, 1))
        .toEqual({ kind: "booleanArray", name: "testName", value: [true, true, true] });
});

test("fieldWithValueNodeArray", () => {
    const field: Tree.INodeArrayField = {
        kind: "nodeArray",
        name: "testName",
        value: [Tree.createNode("old1"), Tree.createNode("old2")],
    };
    expect(Tree.Modifications.fieldWithElement(field, Tree.createNode("new"), 0))
        .toEqual({ kind: "nodeArray", name: "testName", value: [Tree.createNode("new"), Tree.createNode("old2")] });
});

test("nodeWithField", () => {
    const node = Tree.createNode("testNode", b => {
        b.pushStringField("f1", "v1");
        b.pushStringField("f2", "v2");
    });
    expect(Tree.Modifications.nodeWithField(node, { kind: "string", name: "f2", value: "v3" }))
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
    expect(Tree.Modifications.treeWithReplacedNode(node, innerNodeA, innerNodeB))
        .toEqual(Tree.createNode("testNode", b => {
            b.pushNodeField("child", Tree.createNode("child", b => b.pushNodeField("grandChild", innerNodeB)));
        }));
});

test("cloneNode", () => {
    const innerNodeA = Tree.createNode("innerNode", b => {
        b.pushStringField("innerFieldA", "innerValueA");
    });
    const innerNodeB = Tree.createNode("innerNode", b => {
        b.pushName("Inner Node B");
        b.pushStringField("innerFieldB", "innerValueB");
    });
    const node = Tree.createNode("testNode", b => {
        b.pushNodeField("f1", Tree.createNode("child", b => b.pushNodeField("grandChild", innerNodeA)));
        b.pushNodeArrayField("f2", [innerNodeB]);
    });
    // Clone should be different but should contain the same values.
    expect(Tree.Modifications.cloneNode(node)).not.toBe(node);
    expect(Tree.Modifications.cloneNode(node)).toEqual(node);
});
