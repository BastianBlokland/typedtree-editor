import * as Vec from "../src/vector";
import * as Tree from "../src/tree";
import * as TreeView from "../src/treeview";

test("allChildNodeExists", () => {
    let testTree = createTestTree();
    let positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.nodes).toContain(child);
    });
});

test("allNodesHaveSizes", () => {
    let testTree = createTestTree();
    let positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.getSize(testTree)).not.toBe(Vec.zeroVector);
    })
});

test("allNodesHaveAreas", () => {
    let testTree = createTestTree();
    let positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.getArea(testTree)).not.toBe(Vec.zeroVector);
    })
});

test("allNodesHavePositions", () => {
    let testTree = createTestTree();
    let positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.getPosition(testTree)).not.toBe(Vec.zeroVector);
    })
});

test("singleNodeHasExpectedPosition", () => {
    let testTree = Tree.createNode("root");
    let positionTree = TreeView.createPositionTree(testTree);
    expect(positionTree.getPosition(testTree)).toEqual(Vec.zeroVector);
});

test("singleNodeHasExpectedSize", () => {
    let testTree = Tree.createNode("root");
    let positionTree = TreeView.createPositionTree(testTree);
    expect(positionTree.getSize(testTree)).toEqual({ x: TreeView.nodeWidth, y: TreeView.getNodeHeight(testTree) });
});

test("singleNodeHasExpectedArea", () => {
    let testTree = Tree.createNode("root");
    let positionTree = TreeView.createPositionTree(testTree);
    expect(positionTree.getArea(testTree)).toEqual(positionTree.getSize(testTree));
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
