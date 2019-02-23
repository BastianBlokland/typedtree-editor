/**
 * @file Jest tests for treescheme.ts
 */

import * as TreeScheme from "../src/treescheme";

test("cannotPushDuplicateAlias", () => {
    const scheme = TreeScheme.createScheme("testAlias", b => {
        b.pushAlias("testAlias", ["Node1"]);
        expect(b.pushAlias("testAlias", ["Node2"])).toBeFalsy();
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    expect(scheme.aliases.length).toBe(1);
    expect(scheme.getAlias("testAlias")).toEqual(["Node1"]);
});

test("cannotPushDuplicateNodes", () => {
    const scheme = TreeScheme.createScheme("testAlias", b => {
        b.pushAlias("testAlias", ["Node1"]);
        b.pushNodeDefinition("Node1");
        expect(b.pushNodeDefinition("Node1")).toBeFalsy();
    });

    expect(scheme.nodes.length).toBe(1);
});

test("cannotPushNodeWithDuplicateFields", () => {
    const scheme = TreeScheme.createScheme("testAlias", b => {
        b.pushAlias("testAlias", ["Node1"]);
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            expect(b.pushField("field1", "boolean")).toBeFalsy();
        });
    });

    expect(scheme.getNode("Node1")!.fields.length).toBe(1);
    expect(scheme.getNode("Node1")!.getField("field1")!.valueType).toBe("string");
});

test("cannotCreateSchemeWithoutRootAlias", () => {
    expect(() => TreeScheme.createScheme("invalid", b => {
        b.pushAlias("testAlias", ["Node1"]);
        b.pushNodeDefinition("Node2");
    })).toThrowError();
});

test("cannotCreateSchemeWithMissingAlias", () => {
    expect(() => TreeScheme.createScheme("testAlias", b => {
        b.pushAlias("testAlias", ["Node1"]);
        b.pushNodeDefinition("Node2");
    })).toThrowError();
});

test("aliasesCanBeFound", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    expect(scheme.getAlias("Alias1")).toEqual(["Node1", "Node2"]);
});

test("aliasesContainsWorksAsExpected", () => {
    let alias: TreeScheme.Alias | undefined;
    TreeScheme.createScheme("Alias1", b => {
        alias = b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    expect(alias!.containsValue("Node1")).toBeTruthy();
    expect(alias!.containsValue("Node3")).toBeFalsy();
});

test("fieldCanReferenceAnAlias", () => {
    let alias: TreeScheme.Alias | undefined;
    const scheme = TreeScheme.createScheme("Alias1", b => {
        alias = b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2", b => {
            b.pushField("children", alias!, true);
        });
    });

    expect(scheme.getNode("Node2")!.getField("children")!.valueType).toBe(alias);
});

test("fieldsCanBeFound", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1"]);
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "boolean");
            b.pushField("field2", "string", true);
        });
    });

    expect(scheme.getNode("Node1")!.getField("field1")).toEqual({
        name: "field1",
        valueType: "boolean",
        isArray: false,
    });
    expect(scheme.getNode("Node1")!.getField("field2")).toEqual({
        name: "field2",
        valueType: "string",
        isArray: true,
    });
});

test("fieldKindMatchesExpectedOutput", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        const alias = b.pushAlias("Alias1", ["Node1"]);
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "string", true);
            b.pushField("field3", "boolean");
            b.pushField("field4", "boolean", true);
            b.pushField("field5", "number");
            b.pushField("field6", "number", true);
            b.pushField("field7", alias!);
            b.pushField("field8", alias!, true);
        });
    });
    const node = scheme.getNode("Node1");
    expect(TreeScheme.getFieldKind(node!.getField("field1")!)).toBe("string");
    expect(TreeScheme.getFieldKind(node!.getField("field2")!)).toBe("stringArray");
    expect(TreeScheme.getFieldKind(node!.getField("field3")!)).toBe("boolean");
    expect(TreeScheme.getFieldKind(node!.getField("field4")!)).toBe("booleanArray");
    expect(TreeScheme.getFieldKind(node!.getField("field5")!)).toBe("number");
    expect(TreeScheme.getFieldKind(node!.getField("field6")!)).toBe("numberArray");
    expect(TreeScheme.getFieldKind(node!.getField("field7")!)).toBe("node");
    expect(TreeScheme.getFieldKind(node!.getField("field8")!)).toBe("nodeArray");
});
