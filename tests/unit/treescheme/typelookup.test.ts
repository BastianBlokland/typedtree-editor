/**
 * @file Jest tests for treescheme/typelookup.ts
 */

import * as Tree from "../../../src/tree";
import * as TreeScheme from "../../../src/treescheme";

test("schemeCanBeFound", () => {
    const testScheme = createTestScheme();
    const testTree = createTestTree();
    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(testScheme, testTree);
    expect(typeLookup.scheme).toBe(testScheme);
});

test("treeCanBeFound", () => {
    const testScheme = createTestScheme();
    const testTree = createTestTree();
    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(testScheme, testTree);
    expect(typeLookup.root).toBe(testTree);
});

test("rootAliasMatches", () => {
    const testScheme = createTestScheme();
    const testTree = createTestTree();
    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(testScheme, testTree);
    expect(typeLookup.getAlias(testTree)).toBe(testScheme.rootAlias);
});

test("allNodeDefinitionsCanBeFound", () => {
    const testScheme = createTestScheme();
    const testTree = createTestTree();
    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(testScheme, testTree);

    Tree.getAllChildren(testTree).forEach(node => {
        expect(typeLookup.getDefinition(node).nodeType).toEqual(node.type);
    });
});

test("allNodesHaveAnAlias", () => {
    const testScheme = createTestScheme();
    const testTree = createTestTree();
    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(testScheme, testTree);

    Tree.getAllChildren(testTree).forEach(node => {
        expect(typeLookup.getAlias(node).values).toContainEqual(node.type);
        switch (node.type) {
            case "TestAction":
                expect(typeLookup.getAlias(node).identifier).toEqual("Action");
                break;
            case "GroupAction":
                expect(typeLookup.getAlias(node).identifier).toEqual("Action");
                break;
            case "BoolCondition":
                expect(typeLookup.getAlias(node).identifier).toEqual("Condition");
                break;
            case "NumberCondition":
                expect(typeLookup.getAlias(node).identifier).toEqual("Condition");
                break;
            default:
                throw new Error("Unexpected node type");
        }
    });
});

test("noDefinitionCanBeFoundForInvalidNode", () => {
    const testScheme = createTestScheme();
    const testTree = createTestTree();
    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(testScheme, testTree);
    expect(() => typeLookup.getDefinition(Tree.createNode("Invalid"))).toThrowError();
});

test("noAliasCanBeFoundForInvalidNode", () => {
    const testScheme = createTestScheme();
    const testTree = createTestTree();
    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(testScheme, testTree);
    expect(() => typeLookup.getAlias(Tree.createNode("Invalid"))).toThrowError();
});

function createTestScheme(): TreeScheme.IScheme {
    return TreeScheme.createScheme("Action", b => {
        const action = b.pushAlias("Action", ["TestAction", "GroupAction"]);
        const condition = b.pushAlias("Condition", ["BoolCondition", "NumberCondition"]);

        b.pushNodeDefinition("TestAction", b => {
            b.pushField("condition", condition!);
            b.pushField("num", "number");
            b.pushField("str", "string");
        });
        b.pushNodeDefinition("GroupAction", b => {
            b.pushField("conditions", condition!, true);
            b.pushField("actions", action!, true);
        });
        b.pushNodeDefinition("BoolCondition", b => {
            b.pushField("val", "boolean");
        });
        b.pushNodeDefinition("NumberCondition", b => {
            b.pushField("val", "number");
        });
    });
}

function createTestTree(): Tree.INode {
    return Tree.createNode("GroupAction", b => {
        b.pushNodeArrayField("conditions", [
            Tree.createNode("BoolCondition", b => b.pushBooleanField("val", true)),
            Tree.createNode("NumberCondition", b => b.pushNumberField("val", 42)),
        ]);
        b.pushNodeArrayField("actions", [
            Tree.createNode("TestAction", b => {
                b.pushNodeField("condition", Tree.createNode("NumberCondition", b => b.pushNumberField("val", 1)));
                b.pushNumberField("num", 42);
                b.pushStringField("str", "test");
            }),
        ]);
    });
}
