/**
 * @file Jest tests for tree/parser.ts
 */

import * as Tree from "../../../src/tree";

test("fieldTypeIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test"
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(Tree.createNode("test"));
    }
});

test("nullFieldsAreFilteredOut", () => {
    const json = `{
        "$type": "test",
        "field": null
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value.fields.length).toBe(0);
    }
});

test("emptyArraysAreFilteredOut", () => {
    const json = `{
        "$type": "test",
        "field": []
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value.fields.length).toBe(0);
    }
});

test("fieldTypeDefaultsToAnonymous", () => {
    const json = `{ }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value.type).toBe(Tree.anonymousNodeType);
    }
});

test("fieldTypeCannotStartWithLessThen", () => {
    const json = `{
        "$type": "<test"
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("error");
});

test("fieldTypeCannotEndWithGreaterThen", () => {
    const json = `{
        "$type": "test>"
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("error");
});

test("numberIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "num": 42
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushNumberField("num", 42); }));
    }
});

test("stringIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "str": "42"
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushStringField("str", "42"); }));
    }
});

test("booleanIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "bool": true
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
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
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
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
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushNumberArrayField("ar", [42, 1337]); }));
    }
});

test("stringArrayIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "ar": ["42", "1337"]
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
            Tree.createNode("test", b => { b.pushStringArrayField("ar", ["42", "1337"]); }));
    }
});

test("booleanArrayIsParsedSuccessfully", () => {
    const json = `{
        "$type": "test",
        "ar": [true, false]
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
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
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(
            Tree.createNode("test", b => {
                b.pushNodeArrayField("field", [Tree.createNode("child", b => {
                    b.pushNumberField("field2", 42);
                }),
                Tree.createNode("child2", b => {
                    b.pushStringField("field2", "42");
                })]);
            }),
        );
    }
});

test("nodeCanBeParsedFromAnObject", () => {
    const obj = {
        $type: "node1",
        child: { $type: "node2" },
    };

    const parseResult = Tree.Parser.parseObject(obj);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(Tree.createNode("node1", b => {
            b.pushNodeField("child", Tree.createNode("node2"));
        }));
    }
});

test("nodeWithName", () => {
    const json = `{
        "$type": "test",
        "$name": "Hello World"
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(Tree.createNode("test", b => {
            b.pushName("Hello World");
        }));
    }
});

test("emptyNameIsIgnored", () => {
    const json = `{
        "$type": "test",
        "$name": ""
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(Tree.createNode("test"));
    }
});

test("nullNameIsIgnored", () => {
    const json = `{
        "$type": "test",
        "$name": null
    }`;
    const parseResult = Tree.Parser.parseJson(json);
    expect(parseResult.kind).toBe("success");
    if (parseResult.kind === "success") {
        expect(parseResult.value).toEqual(Tree.createNode("test"));
    }
});
