import * as Tree from "../src/tree";
import * as Tree̦Parser from "../src/treeparser";

test("fieldTypeIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test"
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success")
        expect(nodeParseResult.value).toEqual(Tree.createNode("test"));
});

test("fieldTypeIsRequired", () => {
    let json = `{ }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("error");
});

test("fieldTypeIsRequiredInInnerNode", () => {
    let json = `{
        "$type": "test"
        "node": {}
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("error");
});

test("numberIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "num": 42
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushNumberField("num", 42); }));
    }
});

test("stringIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "str": "42"
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushStringField("str", "42"); }));
    }
});

test("booleanIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "bool": true
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushBooleanField("bool", true); }));
    }
});

test("nodeIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "field": {
            "$type": "child",
            "field2": 42
        }
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => {
                b.pushNodeField("field", Tree.createNode("child", b => {
                    b.pushNumberField("field2", 42);
                }));
            }));
    }
});

test("numberArrayIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "ar": [42, 1337]
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushNumberArrayField("ar", [42, 1337]); }));
    }
});

test("stringArrayIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "ar": ["42", "1337"]
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushStringArrayField("ar", ["42", "1337"]); }));
    }
});

test("booleanArrayIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "ar": [true, false]
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
        expect(nodeParseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushBooleanArrayField("ar", [true, false]); }));
    }
});

test("nodeArrayIsParsedSuccessfully", () => {
    let json = `{
        "$type": "test",
        "field": [{
            "$type": "child",
            "field2": 42
        }, {
            "$type": "child2",
            "field2": "42"
        }]
    }`;
    let nodeParseResult = Tree̦Parser.parseJson(json);
    expect(nodeParseResult.kind).toBe("success");
    if (nodeParseResult.kind == "success") {
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
