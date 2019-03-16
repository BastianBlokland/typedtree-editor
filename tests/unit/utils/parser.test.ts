/**
 * @file Jest tests for utils/parser.ts
 */

import * as Utils from "../../../src/utils";

test("isString", () => {
    expect(Utils.Parser.isString(null)).toBe(false);
    expect(Utils.Parser.isString(undefined)).toBe(false);
    expect(Utils.Parser.isString(1)).toBe(false);
    expect(Utils.Parser.isString("test")).toBe(true);
});

test("isBoolean", () => {
    expect(Utils.Parser.isBoolean(null)).toBe(false);
    expect(Utils.Parser.isBoolean(undefined)).toBe(false);
    expect(Utils.Parser.isBoolean(1)).toBe(false);
    expect(Utils.Parser.isBoolean(false)).toBe(true);
});

test("isArray", () => {
    expect(Utils.Parser.isArray(null)).toBe(false);
    expect(Utils.Parser.isArray(undefined)).toBe(false);
    expect(Utils.Parser.isArray(1)).toBe(false);
    expect(Utils.Parser.isArray([])).toBe(true);
});

test("validateString", () => {
    expect(Utils.Parser.validateString(null)).toBe(undefined);
    expect(Utils.Parser.validateString(undefined)).toBe(undefined);
    expect(Utils.Parser.validateString(1)).toBe(undefined);
    expect(Utils.Parser.validateString("test")).toEqual("test");
});

test("validateBoolean", () => {
    expect(Utils.Parser.validateBoolean(null)).toBe(undefined);
    expect(Utils.Parser.validateBoolean(undefined)).toBe(undefined);
    expect(Utils.Parser.validateBoolean(1)).toBe(undefined);
    expect(Utils.Parser.validateBoolean(true)).toEqual(true);
});

test("validateStringArray", () => {
    expect(Utils.Parser.validateStringArray(null)).toBe(undefined);
    expect(Utils.Parser.validateStringArray(undefined)).toBe(undefined);
    expect(Utils.Parser.validateStringArray(1)).toBe(undefined);
    expect(Utils.Parser.validateStringArray(["test", 1])).toBe(undefined);
    expect(Utils.Parser.validateStringArray(["test1", "test2"])).toEqual(["test1", "test2"]);
});
