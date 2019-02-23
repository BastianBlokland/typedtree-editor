import * as Vec from "../src/vector";
import * as Tree from "../src/tree";
import * as TreeView from "../src/tree.view";

test("allChildNodeExists", () => {
    const testTree = createTestTree();
    const positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.nodes).toContain(child);
    });
});

test("allNodesHaveSizes", () => {
    const testTree = createTestTree();
    const positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.getSize(testTree)).not.toBe(Vec.zeroVector);
    })
});

test("allNodesHaveAreas", () => {
    const testTree = createTestTree();
    const positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.getArea(testTree)).not.toBe(Vec.zeroVector);
    })
});

test("allNodesHavePositions", () => {
    const testTree = createTestTree();
    const positionTree = TreeView.createPositionTree(testTree);
    Tree.getAllChildren(testTree).forEach(child => {
        expect(positionTree.getPosition(testTree)).not.toBe(Vec.zeroVector);
    })
});

test("singleNodeHasExpectedPosition", () => {
    const testTree = Tree.createNode("root");
    const positionTree = TreeView.createPositionTree(testTree);
    expect(positionTree.getPosition(testTree)).toEqual(positionTree.rootOffset);
});

test("singleNodeHasExpectedSize", () => {
    const testTree = Tree.createNode("root");
    const positionTree = TreeView.createPositionTree(testTree);
    expect(positionTree.getSize(testTree)).toEqual({ x: TreeView.nodeWidth, y: TreeView.getNodeHeight(testTree) });
});

test("singleNodeHasExpectedArea", () => {
    const testTree = Tree.createNode("root");
    const positionTree = TreeView.createPositionTree(testTree);
    expect(positionTree.getArea(testTree)).toEqual(positionTree.getSize(testTree));
});

function createTestTree(): Tree.Node {
    return Tree.createNode("node1", b => {
        b.pushNodeArrayField("field1", [
            Tree.createNode("node2", b => {
                b.pushNodeField("field2", Tree.createNode("node3"))
            }),
        ]);
        b.pushNodeField("field3", Tree.createNode("node4", b => {
            b.pushNodeArrayField("field3", [
                Tree.createNode("node5", b => {
                    b.pushNodeField("field4", Tree.createNode("node6"))
                    b.pushStringField("field5", "string");
                    b.pushNumberField("field6", 1337);
                    b.pushBooleanField("field7", true);
                }),
                Tree.createNode("node7", b => {
                    b.pushNodeField("field8", Tree.createNode("node8"))
                    b.pushStringArrayField("field9", ["string", "string2"]);
                    b.pushNumberArrayField("field10", [1337, 1338]);
                    b.pushBooleanArrayField("field11", [true, false]);
                }),
                Tree.createNode("node9", b => {
                    b.pushNodeField("anotherField", Tree.createNode("node10"))
                })
            ]);
        }));
    });
}
