/**
 * @file Jest tests for utils/vector.ts
 */

import * as Utils from "../../../src/utils";

test("half", () => {
    expect(Utils.Vector.half({ x: 10, y: 5 })).toEqual({ x: 5, y: 2.5 });
});

test("multiply", () => {
    // number
    expect(Utils.Vector.multiply({ x: 10, y: 5 }, 1)).toEqual({ x: 10, y: 5 });
    expect(Utils.Vector.multiply({ x: 10, y: 5 }, 2)).toEqual({ x: 20, y: 10 });
    expect(Utils.Vector.multiply({ x: 10, y: 5 }, -1)).toEqual({ x: -10, y: -5 });

    // vector2
    expect(Utils.Vector.multiply({ x: 10, y: 5 }, { x: 1, y: 1 })).toEqual({ x: 10, y: 5 });
    expect(Utils.Vector.multiply({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 20, y: 5 });
    expect(Utils.Vector.multiply({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 10, y: 10 });
});

test("divide", () => {
    // number
    expect(Utils.Vector.divide({ x: 10, y: 5 }, 2)).toEqual({ x: 5, y: 2.5 });
    expect(Utils.Vector.divide({ x: 10, y: 5 }, 10)).toEqual({ x: 1, y: 0.5 });
    expect(Utils.Vector.divide({ x: 10, y: 5 }, -1)).toEqual({ x: -10, y: -5 });

    // vector2
    expect(Utils.Vector.divide({ x: 10, y: 5 }, { x: 2, y: 2 })).toEqual({ x: 5, y: 2.5 });
    expect(Utils.Vector.divide({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 5, y: 5 });
    expect(Utils.Vector.divide({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 10, y: 2.5 });
});

test("add", () => {
    // number
    expect(Utils.Vector.add({ x: 10, y: 5 }, 2)).toEqual({ x: 12, y: 7 });
    expect(Utils.Vector.add({ x: 10, y: 5 }, 10)).toEqual({ x: 20, y: 15 });
    expect(Utils.Vector.add({ x: 10, y: 5 }, -1)).toEqual({ x: 9, y: 4 });

    // vector2
    expect(Utils.Vector.add({ x: 10, y: 5 }, { x: 2, y: 2 })).toEqual({ x: 12, y: 7 });
    expect(Utils.Vector.add({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 12, y: 6 });
    expect(Utils.Vector.add({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 11, y: 7 });
});

test("subtract", () => {
    // number
    expect(Utils.Vector.subtract({ x: 10, y: 5 }, 2)).toEqual({ x: 8, y: 3 });
    expect(Utils.Vector.subtract({ x: 10, y: 5 }, 10)).toEqual({ x: 0, y: -5 });
    expect(Utils.Vector.subtract({ x: 10, y: 5 }, -1)).toEqual({ x: 11, y: 6 });

    // vector2
    expect(Utils.Vector.subtract({ x: 10, y: 5 }, { x: 2, y: 2 })).toEqual({ x: 8, y: 3 });
    expect(Utils.Vector.subtract({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 8, y: 4 });
    expect(Utils.Vector.subtract({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 9, y: 3 });
});

test("invert", () => {
    expect(Utils.Vector.invert({ x: 10, y: -5 })).toEqual({ x: -10, y: 5 });
    expect(Utils.Vector.invert({ x: -10, y: 5 })).toEqual({ x: 10, y: -5 });
});

test("lerp", () => {
    expect(Utils.Vector.lerp({ x: 5, y: 10 }, { x: 15, y: 0 }, 0)).toEqual({ x: 5, y: 10 });
    expect(Utils.Vector.lerp({ x: 5, y: 10 }, { x: 15, y: 0 }, 1)).toEqual({ x: 15, y: 0 });
    expect(Utils.Vector.lerp({ x: 5, y: 10 }, { x: 15, y: 0 }, .5)).toEqual({ x: 10, y: 5 });
});

test("createVector", () => {
    expect(Utils.Vector.createVector(5, 10)).toEqual({ x: 5, y: 10 });
});
