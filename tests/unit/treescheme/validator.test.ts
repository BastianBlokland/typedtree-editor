/**
 * @file Jest tests for treescheme/validator.ts
 */

import * as Tree from "../../../src/tree";
import * as TreeScheme from "../../../src/treescheme";

test("validTreeDoesValidate", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1"]);
        const alias2 = b.pushAlias("Alias2", ["Node2"]);
        const enumeration = b.pushEnum("Enum1", [{ value: 0, name: "A" }, { value: 1, name: "B" }]);

        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", alias2!);
            b.pushField("field2", enumeration!, true);
        });
        b.pushNodeDefinition("Node2", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "number");
            b.pushField("field3", enumeration!);
        });
    });

    const tree = Tree.createNode("Node1", b => {
        b.pushNodeField("field1", Tree.createNode("Node2", b => {
            b.pushStringField("field1", "test");
            b.pushNumberField("field2", 1337);
            b.pushNumberField("field3", 1);
        }));
        b.pushNumberArrayField("field2", [0, 1, 1, 0]);
    });
    expect(TreeScheme.Validator.validate(scheme, tree)).toBe(true);
});

test("invalidNodeTypeDoesNotValidate", () => {
    const scheme = TreeScheme.createScheme("Alias", b => {
        b.pushAlias("Alias", ["Node1"]);

        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    const tree = Tree.createNode("Node3");
    expect(TreeScheme.Validator.validate(scheme, tree)).not.toBe(true);
});

test("invalidFieldNameDoesNotValidate", () => {
    const scheme = TreeScheme.createScheme("Alias", b => {
        b.pushAlias("Alias", ["Node1"]);

        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "number");
        });
        b.pushNodeDefinition("Node2");
    });

    const tree = Tree.createNode("Node1", b => {
        b.pushStringField("field1", "test");
        b.pushNumberField("field3", 1337);
    });
    expect(TreeScheme.Validator.validate(scheme, tree)).not.toBe(true);
});

test("invalidFieldTypeDoesNotValidate", () => {
    const scheme = TreeScheme.createScheme("Alias", b => {
        b.pushAlias("Alias", ["Node1"]);

        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "number");
        });
        b.pushNodeDefinition("Node2");
    });

    const tree = Tree.createNode("Node1", b => {
        b.pushStringField("field2", "test");
        b.pushNumberField("field1", 1337);
    });
    expect(TreeScheme.Validator.validate(scheme, tree)).not.toBe(true);
});

test("invalidEnumValueDoesNotValidate", () => {
    const scheme = TreeScheme.createScheme("Alias", b => {
        b.pushAlias("Alias", ["Node1"]);
        const enumeration = b.pushEnum("Enum1", [{ value: 0, name: "A" }, { value: 1, name: "B" }]);

        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", enumeration!);
        });
    });

    const tree = Tree.createNode("Node1", b => {
        b.pushNumberField("field1", 2);
    });
    expect(TreeScheme.Validator.validate(scheme, tree)).not.toBe(true);
});

test("nodeDefinitionCanHaveTheSameNameAsAnAlias", () => {
    const scheme = TreeScheme.createScheme("Alias", b => {
        const alias = b.pushAlias("Alias", ["Alias"]);
        b.pushNodeDefinition("Alias", b => b.pushField("Alias", alias!));
    });
    const tree = Tree.createNode("Alias", b => {
        b.pushNodeField("Alias", Tree.createNode("Alias"));
    });
    expect(TreeScheme.Validator.validate(scheme, tree)).toBe(true);
});
