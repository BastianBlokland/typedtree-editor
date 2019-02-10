import * as TreeScheme from "../src/treescheme";

test("cannotPushDuplicateAlias", () => {
    const scheme = TreeScheme.createScheme(b => {
        b.pushAlias("testAlias", ["Node1"]);
        expect(b.pushAlias("testAlias", ["Node2"])).toBeFalsy();
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    })

    expect(scheme.aliases.length).toBe(1);
    expect(scheme.getAlias("testAlias")).toEqual(["Node1"]);
});

test("cannotPushDuplicateNodes", () => {
    const scheme = TreeScheme.createScheme(b => {
        b.pushNodeDefinition("Node1");
        expect(b.pushNodeDefinition("Node1")).toBeFalsy();
    })

    expect(scheme.nodes.length).toBe(1);
});

test("cannotPushNodeWithDuplicateFields", () => {
    const scheme = TreeScheme.createScheme(b => {
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            expect(b.pushField("field1", "boolean")).toBeFalsy();
        });
    })

    expect(scheme.getNode("Node1")!.fields.length).toBe(1);
    expect(scheme.getNode("Node1")!.getField("field1")!.valueType).toBe("string");
});

test("cannotCreateSchemeWithMissingAlias", () => {
    expect(() => TreeScheme.createScheme(b => {
        b.pushAlias("testAlias", ["Node1"]);
        b.pushNodeDefinition("Node2");
    })).toThrowError();
});

test("aliasesCanBeFound", () => {
    const scheme = TreeScheme.createScheme(b => {
        b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    expect(scheme.getAlias("Alias1")).toEqual(["Node1", "Node2"]);
});

test("fieldCanReferenceAnAlias", () => {
    let alias: TreeScheme.Alias | undefined = undefined;
    const scheme = TreeScheme.createScheme(b => {
        alias = b.pushAlias("Alias1", ["Node1", "Node2"]);
        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2", b => {
            b.pushField("children", alias!, true);
        });
    });

    expect(scheme.getNode("Node2")!.getField("children")!.valueType).toBe(alias);
});

test("fieldsCanBeFound", () => {
    const scheme = TreeScheme.createScheme(b => {
        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "boolean");
            b.pushField("field2", "string", true);
        });
    });

    expect(scheme.getNode("Node1")!.getField("field1")).toEqual({
        name: "field1",
        valueType: "boolean",
        isArray: false
    });
    expect(scheme.getNode("Node1")!.getField("field2")).toEqual({
        name: "field2",
        valueType: "string",
        isArray: true
    });
});
