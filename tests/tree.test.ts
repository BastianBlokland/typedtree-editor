import * as Tree from "../src/tree";

test("getNodeCount", () => {
    let testTree = createTestData();
    expect(Tree.getNodeCount(testTree)).toBe(10);
});

test("forEachDirectChild", () => {
    let testTree = createTestData();
    let directChildNames: string[] = [];
    Tree.forEachDirectChild(testTree, child => directChildNames.push(child.type));

    expect(directChildNames).toEqual(["thing1", "thing2"]);
});

test("forEachDirectChild", () => {
    let testTree = createTestData();
    let directChildNames = Tree.getDirectChildren(testTree).map(child => child.type);

    expect(directChildNames).toEqual(["thing1", "thing2"]);
});

test("fieldNames", () => {
    let testTree = createTestData();
    let fieldNames = testTree.fields.map(field => field.name);

    expect(fieldNames).toEqual(["fieldA", "fieldB"]);
});

test("fieldTypes", () => {
    let testTree = createTestData();
    let fieldValues = testTree.fields.map(field => field.value.kind);

    expect(fieldValues).toEqual(["nodeArray", "node"]);
});

function createTestData(): Tree.Node {
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
