/**
 * @file Jest tests for tree/path.ts
 */

import * as Tree from "../../../src/tree";

test("findPathToRoot", () => {
    let nodeToTest: Tree.INode | undefined;
    const root = Tree.createNode("nodeA", b => {
        b.pushNodeArrayField("children", [
            Tree.createNode("childA", b => {
                b.pushNodeArrayField("grandChildren", [
                    Tree.createNode("grandChildA"),
                    Tree.createNode("grandChildB"),
                    Tree.createNode("grandChildC"),
                ]);
            }),
            Tree.createNode("childB", b => {
                b.pushNodeArrayField("grandChildren", [
                    Tree.createNode("grandChildA"),
                    Tree.createNode("grandChildB"),
                    nodeToTest = Tree.createNode("grandChildC"),
                ]);
            }),
            Tree.createNode("childC", b => {
                b.pushNodeArrayField("grandChildren", [
                    Tree.createNode("grandChildA"),
                    Tree.createNode("grandChildB"),
                    Tree.createNode("grandChildC"),
                ]);
            }),
        ]);
    });

    const expectedPath: Tree.Path.IParent[] = [];
    expectedPath.unshift({
        node: root,
        output: { fieldName: "children", offset: 1 },
    });
    expectedPath.unshift({
        node: root.getChild({ fieldName: "children", offset: 1 })!,
        output: { fieldName: "grandChildren", offset: 2 },
    });

    expect(Tree.Path.findPathToRoot(root, nodeToTest!)).toEqual(expectedPath);
});

test("getParentFindsDirectParent", () => {
    const root = Tree.createNode("nodeA", b => {
        b.pushNodeField("nodeField", Tree.createNode("nodeB"));
        b.pushNodeArrayField("nodeArrayField", [Tree.createNode("nodeC"), Tree.createNode("nodeD")]);
    });
    Tree.forEachDirectChild(root, (child, output) => {
        expect(Tree.Path.getParent(root, child)).toEqual({ node: root, output });
    });
});

test("getParentOfUnrelatedNodesThrows", () => {
    const root = Tree.createNode("nodeA");
    const node = Tree.createNode("nodeB");
    expect(() => Tree.Path.getParent(root, node)).toThrowError();
});
