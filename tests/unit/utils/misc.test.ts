/**
 * @file Jest tests for utils/misc.ts
 */

import * as Utils from "../../../src/utils";

test("withReplacedElement", () => {
    expect(Utils.withReplacedElement([1, 2, 3], 0, 1337)).toEqual([1337, 2, 3]);
    expect(Utils.withReplacedElement([1, 2, 3], 1, 1337)).toEqual([1, 1337, 3]);
    expect(Utils.withReplacedElement([1, 2, 3], 2, 1337)).toEqual([1, 2, 1337]);
    expect(() => Utils.withReplacedElement([1], -1, 1337)).toThrowError();
    expect(() => Utils.withReplacedElement([1], 1, 1337)).toThrowError();
});

test("withExtraElement", () => {
    expect(Utils.withExtraElement([1, 2, 3], 0, 1337)).toEqual([1337, 1, 2, 3]);
    expect(Utils.withExtraElement([1, 2, 3], 1, 1337)).toEqual([1, 1337, 2, 3]);
    expect(Utils.withExtraElement([1, 2, 3], 2, 1337)).toEqual([1, 2, 1337, 3]);
    expect(Utils.withExtraElement([1, 2, 3], 3, 1337)).toEqual([1, 2, 3, 1337]);
    expect(() => Utils.withExtraElement([1], -1, 1337)).toThrowError();
    expect(() => Utils.withExtraElement([1], 2, 1337)).toThrowError();
});

test("withoutElement", () => {
    expect(Utils.withoutElement([1, 2, 3], 0)).toEqual([2, 3]);
    expect(Utils.withoutElement([1, 2, 3], 1)).toEqual([1, 3]);
    expect(Utils.withoutElement([1, 2, 3], 2)).toEqual([1, 2]);
    expect(() => Utils.withoutElement([1], -1)).toThrowError();
    expect(() => Utils.withoutElement([1], 1)).toThrowError();
});

test("withSwappedElements", () => {
    expect(Utils.withSwappedElements([1, 2, 3], 1, 2)).toEqual([1, 3, 2]);
    expect(Utils.withSwappedElements([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(() => Utils.withSwappedElements([1], 0, -1)).toThrowError();
    expect(() => Utils.withSwappedElements([1], 0, 1)).toThrowError();
    expect(() => Utils.withSwappedElements([1], -1, 0)).toThrowError();
    expect(() => Utils.withSwappedElements([1], 1, 0)).toThrowError();
});

test("find", () => {
    const array = [{ name: "foo", id: 1 }, { name: "bar", id: 2 }, { name: "baz", id: 3 }];
    expect(Utils.find(array, elem => elem.id === 1)).toEqual(array[0]);
    expect(Utils.find(array, elem => elem.id === 2)).toEqual(array[1]);
    expect(Utils.find(array, elem => elem.id === 3)).toEqual(array[2]);
});

test("formatJson", () => {
    const json = `{ "a": 5, "b": [ 1, 13, 133, 1337 ] }`;
    expect(Utils.formatJson(json)).toBe(`{\n  "a": 5,\n  "b": [\n    1,\n    13,\n    133,\n    1337\n  ]\n}`);
});

test("hasDuplicates", () => {
    expect(Utils.hasDuplicates([1, 2, 3])).toBeFalsy();
    expect(Utils.hasDuplicates([1, 2, 3, 2, 3])).toBeTruthy();
    expect(Utils.hasDuplicates(["foo", "bar", "foo", "foo"])).toBeTruthy();
    expect(Utils.hasDuplicates(["foo", "bar"])).toBeFalsy();
    expect(Utils.hasDuplicates([true, false, false])).toBeTruthy();
    expect(Utils.hasDuplicates([true, false])).toBeFalsy();
});

test("findDuplicates", () => {
    expect(Utils.findDuplicates([1, 2, 3])).toEqual([]);
    expect(Utils.findDuplicates([1, 2, 3, 2, 3])).toEqual([2, 3]);
    expect(Utils.findDuplicates(["foo", "bar", "foo", "foo"])).toEqual(["foo"]);
    expect(Utils.findDuplicates([true, false, false])).toEqual([false]);
});

test("lerp", () => {
    expect(Utils.lerp(-5, 5, 0)).toBe(-5);
    expect(Utils.lerp(-5, 5, 0.5)).toBe(0);
    expect(Utils.lerp(-5, 5, 1)).toBe(5);
    expect(Utils.lerp(0, 1, 2)).toBe(2);
    expect(Utils.lerp(0, 1, -2)).toBe(-2);
});

test("clamp", () => {
    expect(Utils.clamp(2, -5, 5)).toBe(2);
    expect(Utils.clamp(-7, -5, 5)).toBe(-5);
    expect(Utils.clamp(7, -5, 5)).toBe(5);
});

test("half", () => {
    expect(Utils.half(2)).toBe(1);
    expect(Utils.half(10)).toBe(5);
});

test("add", () => {
    expect(Utils.add(1, 5)).toBe(6);
});

test("subtract", () => {
    expect(Utils.subtract(5, 1)).toBe(4);
});
