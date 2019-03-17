/**
 * @file Jest tests for treescheme/treescheme.ts
 */

import * as TreeScheme from "../../../src/treescheme";

test("cannotPushDuplicateAlias", () => {
    const scheme = TreeScheme.createScheme("testAlias", b => {
        b.pushAlias("testAlias", ["Node1"]);
        expect(b.pushAlias("testAlias", ["Node2"])).toBeFalsy();
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    expect(scheme.aliases.length).toBe(1);
    expect(scheme.getAlias("testAlias")!.values).toEqual(["Node1"]);
});

test("cannotPushDuplicateEnum", () => {
    const scheme = TreeScheme.createScheme("testAlias", b => {
        b.pushAlias("testAlias", ["Node1"]);
        b.pushEnum("enum1", [{ value: 0, name: "A" }]);

        // Cannot push enum with the same identifier as an existing enum
        expect(b.pushEnum("enum1", [{ value: 0, name: "B" }])).toBeFalsy();
        // Cannot push enum with the same identifier as an existing alias
        expect(b.pushEnum("testAlias", [{ value: 0, name: "A" }])).toBeFalsy();

        b.pushNodeDefinition("Node1");
    });

    expect(scheme.enums.length).toBe(1);
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

    expect(scheme.getAlias("Alias1")!.values).toEqual(["Node1", "Node2"]);
});

test("aliasesContainsWorksAsExpected", () => {
    let alias: TreeScheme.IAlias | undefined;
    TreeScheme.createScheme("Alias1", b => {
        alias = b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    expect(alias!.containsValue("Node1")).toBeTruthy();
    expect(alias!.containsValue("Node3")).toBeFalsy();
});

test("enumsCanBeFound", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1"]);
        b.pushNodeDefinition("Node1");

        b.pushEnum("enum1", [{ value: 0, name: "B" }]);
    });

    expect(scheme.getEnum("enum1")!.values).toEqual([{ value: 0, name: "B" }]);
});

test("enumNamesCanBeLookedUp", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1"]);
        b.pushNodeDefinition("Node1");

        b.pushEnum("enum1", [
            { value: -1, name: "B" },
            { value: 5, name: "C" },
            { value: 1337, name: "D" },
        ]);
    });

    expect(scheme.getEnum("enum1")!.getName(-1)).toBe("B");
    expect(scheme.getEnum("enum1")!.getName(5)).toBe("C");
    expect(scheme.getEnum("enum1")!.getName(1337)).toBe("D");
    expect(scheme.getEnum("enum1")!.getName(0)).toBe(undefined);
});

test("fieldCanReferenceAnAlias", () => {
    let alias: TreeScheme.IAlias | undefined;
    const scheme = TreeScheme.createScheme("Alias1", b => {
        alias = b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2", b => {
            b.pushField("children", alias!, true);
        });
    });

    expect(scheme.getNode("Node2")!.getField("children")!.valueType).toBe(alias);
});

test("fieldCanReferenceAnEnum", () => {
    let enumEntry: TreeScheme.IEnum | undefined;
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1"]);
        enumEntry = b.pushEnum("testEnum", [{ value: 0, name: "A" }]);

        b.pushNodeDefinition("Node1", b => {
            b.pushField("choice", enumEntry!);
        });
    });

    expect(scheme.getNode("Node1")!.getField("choice")!.valueType).toBe(enumEntry);
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
        const enumeration = b.pushEnum("Enum1", [{ value: 0, name: "A" }, { value: 1, name: "B" }]);
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "string", true);
            b.pushField("field3", "boolean");
            b.pushField("field4", "boolean", true);
            b.pushField("field5", "number");
            b.pushField("field6", "number", true);
            b.pushField("field7", alias!);
            b.pushField("field8", alias!, true);
            b.pushField("field9", enumeration!);
            b.pushField("field10", enumeration!, true);
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
    expect(TreeScheme.getFieldKind(node!.getField("field9")!)).toBe("number");
    expect(TreeScheme.getFieldKind(node!.getField("field10")!)).toBe("numberArray");
});

test("aliasFieldsAreIdentifiedCorrectly", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        const alias = b.pushAlias("Alias1", ["Node1"]);
        const enumeration = b.pushEnum("Enum1", [{ value: 0, name: "A" }, { value: 1, name: "B" }]);
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "boolean");
            b.pushField("field3", "number");
            b.pushField("field4", alias!);
            b.pushField("field5", enumeration!);
        });
    });
    const node = scheme.getNode("Node1");
    expect(TreeScheme.isAliasType(node!.getField("field1")!.valueType)).toBe(false);
    expect(TreeScheme.isAliasType(node!.getField("field2")!.valueType)).toBe(false);
    expect(TreeScheme.isAliasType(node!.getField("field3")!.valueType)).toBe(false);
    expect(TreeScheme.isAliasType(node!.getField("field4")!.valueType)).toBe(true);
    expect(TreeScheme.isAliasType(node!.getField("field5")!.valueType)).toBe(false);
});

test("aliasDefaultReturnsAsExpected", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });
    expect(TreeScheme.getDefaultDefinition(scheme, scheme.rootAlias).nodeType).toBe("Node1");
});
