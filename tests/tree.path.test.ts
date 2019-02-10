import * as Tree from "../src/tree";
import * as TreePath from "../src/tree.path";

test("findPathToRoot", () => {
    let nodeToTest: Tree.Node | undefined;
    const root = Tree.createNode("nodeA", b => {
        b.pushNodeArrayField("children", [
            Tree.createNode("childA", b => {
                b.pushNodeArrayField("grandChildren", [
                    Tree.createNode("grandChildA"),
                    Tree.createNode("grandChildB"),
                    Tree.createNode("grandChildC")
                ]);
            }),
            Tree.createNode("childB", b => {
                b.pushNodeArrayField("grandChildren", [
                    Tree.createNode("grandChildA"),
                    Tree.createNode("grandChildB"),
                    nodeToTest = Tree.createNode("grandChildC")
                ]);
            }),
            Tree.createNode("childC", b => {
                b.pushNodeArrayField("grandChildren", [
                    Tree.createNode("grandChildA"),
                    Tree.createNode("grandChildB"),
                    Tree.createNode("grandChildC")
                ]);
            })
        ]);
    });

    let expectedPath: TreePath.Parent[] = [];
    expectedPath.unshift({ node: root, output: { fieldName: "children", offset: 1 } });
    expectedPath.unshift({ node: root.getChild({ fieldName: "children", offset: 1 })!, output: { fieldName: "grandChildren", offset: 2 } });

    expect(TreePath.findPathToRoot(root, nodeToTest!)).toEqual(expectedPath);
});

test("getParentFindsDirectParent", () => {
    const root = Tree.createNode("nodeA", b => {
        b.pushNodeField("nodeField", Tree.createNode("nodeB"));
        b.pushNodeArrayField("nodeArrayField", [Tree.createNode("nodeC"), Tree.createNode("nodeD")]);
    });
    Tree.forEachDirectChild(root, (child, output) => {
        expect(TreePath.getParent(root, child)).toEqual({ node: root, output: output });
    });
});

test("getParentOfUnrelatedNodesThrows", () => {
    const root = Tree.createNode("nodeA");
    const node = Tree.createNode("nodeB");
    expect(() => TreePath.getParent(root, node)).toThrowError();
});
