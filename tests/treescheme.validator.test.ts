import * as Tree from "../src/tree";
import * as TreeScheme from "../src/treescheme";
import * as TreeSchemeValidator from "../src/treescheme.validator";

test("validTreeDoesValidate", () => {
    const scheme = TreeScheme.createScheme("Alias1", b => {
        b.pushAlias("Alias1", ["Node1"]);
        const alias2 = b.pushAlias("Alias2", ["Node2"]);

        b.pushNodeDefinition("Node1", b => {
            b.pushField("field1", alias2!);
        });
        b.pushNodeDefinition("Node2", b => {
            b.pushField("field1", "string");
            b.pushField("field2", "number");
        });
    });

    const tree = Tree.createNode("Node1", b => {
        b.pushNodeField("field1", Tree.createNode("Node2", b => {
            b.pushStringField("field1", "test");
            b.pushNumberField("field2", 1337);
        }));
    });
    expect(TreeSchemeValidator.validate(scheme, tree)).toBe(true);
});

test("invalidNodeTypeDoesNotValidate", () => {
    const scheme = TreeScheme.createScheme("Alias", b => {
        b.pushAlias("Alias", ["Node1"]);

        b.pushNodeDefinition("Node1");
        b.pushNodeDefinition("Node2");
    });

    const tree = Tree.createNode("Node3");
    expect(TreeSchemeValidator.validate(scheme, tree)).not.toBe(true);
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
    expect(TreeSchemeValidator.validate(scheme, tree)).not.toBe(true);
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
    expect(TreeSchemeValidator.validate(scheme, tree)).not.toBe(true);
});
