import * as Tree from "../src/tree";

test("getNodeCount", () => {
    let testTree = createTestTree();
    expect(Tree.getNodeCount(testTree)).toBe(10);
});

test("forEachDirectChild", () => {
    let testTree = createTestTree();
    let directChildTypes: string[] = [];
    Tree.forEachDirectChild(testTree, child => directChildTypes.push(child.type));

    expect(directChildTypes).toEqual(["thing1", "thing2"]);
});

test("getDirectChildren", () => {
    let testTree = createTestTree();
    let directChildTypes = Tree.getDirectChildren(testTree).map(child => child.type);

    expect(directChildTypes).toEqual(["thing1", "thing2"]);
});

test("getAllChildren", () => {
    let testTree = createTestTree();
    let allChildTypes = Tree.getAllChildren(testTree).map(child => child.type);

    expect(allChildTypes).toEqual([
        "thing1",
        "anotherThing",
        "thing2",
        "child1",
        "anotherThing",
        "child2",
        "anotherThing",
        "child3",
        "anotherThing"
    ]);
});

test("fieldNames", () => {
    let testTree = createTestTree();
    let fieldNames = testTree.fields.map(field => field.name);

    expect(fieldNames).toEqual(["fieldA", "fieldB"]);
});

test("fieldTypes", () => {
    let testTree = createTestTree();
    let fieldValues = testTree.fields.map(field => field.value.kind);

    expect(fieldValues).toEqual(["nodeArray", "node"]);
});

function createTestTree(): Tree.Node {
    return Tree.createNode("Root", b => {
        b.pushNodeArrayField("fieldA", [
            Tree.createNode("thing1", b => {
                b.pushNodeField("anotherField", Tree.createNode("anotherThing"))
            }),
        ]);
        b.pushNodeField("fieldB", Tree.createNode("thing2", b => {
            b.pushNodeArrayField("children", [
                Tree.createNode("child1", b => {
                    b.pushNodeField("anotherField", Tree.createNode("anotherThing"))
                }),
                Tree.createNode("child2", b => {
                    b.pushNodeField("anotherField", Tree.createNode("anotherThing"))
                }),
                Tree.createNode("child3", b => {
                    b.pushNodeField("anotherField", Tree.createNode("anotherThing"))
                })
            ]);
        }));
    });
}
