import * as Tree from "../src/tree";
import * as TreeModifications from "../src/treemodifications";

test("fieldWithValueString", () => {
    const field: Tree.StringField = { kind: "string", name: "testName", value: "oldValue" };
    expect(TreeModifications.fieldWithValue(field, "newValue"))
        .toEqual({ kind: "string", name: "testName", value: "newValue" });
});

test("fieldWithValueNumber", () => {
    const field: Tree.NumberField = { kind: "number", name: "testName", value: 1 };
    expect(TreeModifications.fieldWithValue(field, 2))
        .toEqual({ kind: "number", name: "testName", value: 2 });
});

test("fieldWithValueBoolean", () => {
    const field: Tree.BooleanField = { kind: "boolean", name: "testName", value: false };
    expect(TreeModifications.fieldWithValue(field, true))
        .toEqual({ kind: "boolean", name: "testName", value: true });
});

test("fieldWithValueNode", () => {
    const field: Tree.NodeField = { kind: "node", name: "testName", value: Tree.createNode("old") };
    expect(TreeModifications.fieldWithValue(field, Tree.createNode("new")))
        .toEqual({ kind: "node", name: "testName", value: Tree.createNode("new") });
});

test("fieldWithValueStringArray", () => {
    const field: Tree.StringArrayField = { kind: "stringArray", name: "testName", value: ["oldValue1", "oldValue2"] };
    expect(TreeModifications.fieldWithValue(field, "newValue", 1))
        .toEqual({ kind: "stringArray", name: "testName", value: ["oldValue1", "newValue"] });
});

test("fieldWithValueNumberArray", () => {
    const field: Tree.NumberArrayField = { kind: "numberArray", name: "testName", value: [1, 2, 3] };
    expect(TreeModifications.fieldWithValue(field, 1337, 0))
        .toEqual({ kind: "numberArray", name: "testName", value: [1337, 2, 3] });
});

test("fieldWithValueBooleanArray", () => {
    const field: Tree.BooleanArrayField = { kind: "booleanArray", name: "testName", value: [true, false, true] };
    expect(TreeModifications.fieldWithValue(field, true, 1))
        .toEqual({ kind: "booleanArray", name: "testName", value: [true, true, true] });
});

test("fieldWithValueNodeArray", () => {
    const field: Tree.NodeArrayField = { kind: "nodeArray", name: "testName", value: [Tree.createNode("old1"), Tree.createNode("old2")] };
    expect(TreeModifications.fieldWithValue(field, Tree.createNode("new"), 0))
        .toEqual({ kind: "nodeArray", name: "testName", value: [Tree.createNode("new"), Tree.createNode("old2")] });
});
