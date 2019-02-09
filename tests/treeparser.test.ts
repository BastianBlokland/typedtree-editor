import * as Tree from "../src/tree";
import * as Tree̦Parser from "../src/treeparser";

test("fieldTypeIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test"
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success")
        expect(nodeParseResult.value).toEqual(Tree.createNode("test"));
});

test("nullFieldsAreFilteredOut", () => {
    const json = `{
        "$type": "test",
        "field": null
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success")
        expect(nodeParseResult.value.fields.length).toBe(0);
});

test("emptyArraysAreFilteredOut", () => {
    const json = `{
        "$type": "test",
        "field": []
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success")
        expect(nodeParseResult.value.fields.length).toBe(0);
});

test("fieldTypeDefaultsToAnonymous", () => {
    const json = `{ }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success")
        expect(nodeParseResult.value.type).toBe("Anonymous");
});

test("numberIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "num": 42
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushNumberField("num", 42); }));
    }
});

test("stringIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "str": "42"
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushStringField("str", "42"); }));
    }
});

test("booleanIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "bool": true
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushBooleanField("bool", true); }));
    }
});

test("nodeIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "field": {
            "$type": "child",
            "field2": 42
        }
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => {
                b.pushNodeField("field", Tree.createNode("child", b => {
                    b.pushNumberField("field2", 42);
                }));
            }));
    }
});

test("numberArrayIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "ar": [42, 1337]
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushNumberArrayField("ar", [42, 1337]); }));
    }
});

test("stringArrayIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "ar": ["42", "1337"]
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushStringArrayField("ar", ["42", "1337"]); }));
    }
});

test("booleanArrayIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "ar": [true, false]
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushBooleanArrayField("ar", [true, false]); }));
    }
});

test("nodeArrayIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "field": [{
            "$type": "child",
            "field2": 42
        }, {
            "$type": "child2",
            "field2": "42"
        }]
    }`;
    const nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind === "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => {
                b.pushNodeArrayField("field", [Tree.createNode("child", b => {
                    b.pushNumberField("field2", 42);
                }),
                Tree.createNode("child2", b => {
                    b.pushStringField("field2", "42");
                })])
            })
        );
    }
});
