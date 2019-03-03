/**
 * @file Jest tests for parserutils.ts
 */

import * as ParserUtils from "../../src/parserutils";

test("isString", () => {
    expect(ParserUtils.isString(null)).toBe(false);
    expect(ParserUtils.isString(undefined)).toBe(false);
    expect(ParserUtils.isString(1)).toBe(false);
    expect(ParserUtils.isString("test")).toBe(true);
});

test("isBoolean", () => {
    expect(ParserUtils.isBoolean(null)).toBe(false);
    expect(ParserUtils.isBoolean(undefined)).toBe(false);
    expect(ParserUtils.isBoolean(1)).toBe(false);
    expect(ParserUtils.isBoolean(false)).toBe(true);
});

test("isArray", () => {
    expect(ParserUtils.isArray(null)).toBe(false);
    expect(ParserUtils.isArray(undefined)).toBe(false);
    expect(ParserUtils.isArray(1)).toBe(false);
    expect(ParserUtils.isArray([])).toBe(true);
});

test("validateString", () => {
    expect(ParserUtils.validateString(null)).toBe(undefined);
    expect(ParserUtils.validateString(undefined)).toBe(undefined);
    expect(ParserUtils.validateString(1)).toBe(undefined);
    expect(ParserUtils.validateString("test")).toEqual("test");
});

test("validateBoolean", () => {
    expect(ParserUtils.validateBoolean(null)).toBe(undefined);
    expect(ParserUtils.validateBoolean(undefined)).toBe(undefined);
    expect(ParserUtils.validateBoolean(1)).toBe(undefined);
    expect(ParserUtils.validateBoolean(true)).toEqual(true);
});

test("validateStringArray", () => {
    expect(ParserUtils.validateStringArray(null)).toBe(undefined);
    expect(ParserUtils.validateStringArray(undefined)).toBe(undefined);
    expect(ParserUtils.validateStringArray(1)).toBe(undefined);
    expect(ParserUtils.validateStringArray(["test", 1])).toBe(undefined);
    expect(ParserUtils.validateStringArray(["test1", "test2"])).toEqual(["test1", "test2"]);
});
