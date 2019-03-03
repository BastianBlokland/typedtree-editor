/**
 * @file Jest tests for vector.ts
 */

import * as Vec from "../../src/vector";

test("half", () => {
    expect(Vec.half({ x: 10, y: 5 })).toEqual({ x: 5, y: 2.5 });
});

test("multiply", () => {
    // number
    expect(Vec.multiply({ x: 10, y: 5 }, 1)).toEqual({ x: 10, y: 5 });
    expect(Vec.multiply({ x: 10, y: 5 }, 2)).toEqual({ x: 20, y: 10 });
    expect(Vec.multiply({ x: 10, y: 5 }, -1)).toEqual({ x: -10, y: -5 });

    // vector2
    expect(Vec.multiply({ x: 10, y: 5 }, { x: 1, y: 1 })).toEqual({ x: 10, y: 5 });
    expect(Vec.multiply({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 20, y: 5 });
    expect(Vec.multiply({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 10, y: 10 });
});

test("divide", () => {
    // number
    expect(Vec.divide({ x: 10, y: 5 }, 2)).toEqual({ x: 5, y: 2.5 });
    expect(Vec.divide({ x: 10, y: 5 }, 10)).toEqual({ x: 1, y: 0.5 });
    expect(Vec.divide({ x: 10, y: 5 }, -1)).toEqual({ x: -10, y: -5 });

    // vector2
    expect(Vec.divide({ x: 10, y: 5 }, { x: 2, y: 2 })).toEqual({ x: 5, y: 2.5 });
    expect(Vec.divide({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 5, y: 5 });
    expect(Vec.divide({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 10, y: 2.5 });
});

test("add", () => {
    // number
    expect(Vec.add({ x: 10, y: 5 }, 2)).toEqual({ x: 12, y: 7 });
    expect(Vec.add({ x: 10, y: 5 }, 10)).toEqual({ x: 20, y: 15 });
    expect(Vec.add({ x: 10, y: 5 }, -1)).toEqual({ x: 9, y: 4 });

    // vector2
    expect(Vec.add({ x: 10, y: 5 }, { x: 2, y: 2 })).toEqual({ x: 12, y: 7 });
    expect(Vec.add({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 12, y: 6 });
    expect(Vec.add({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 11, y: 7 });
});

test("subtract", () => {
    // number
    expect(Vec.subtract({ x: 10, y: 5 }, 2)).toEqual({ x: 8, y: 3 });
    expect(Vec.subtract({ x: 10, y: 5 }, 10)).toEqual({ x: 0, y: -5 });
    expect(Vec.subtract({ x: 10, y: 5 }, -1)).toEqual({ x: 11, y: 6 });

    // vector2
    expect(Vec.subtract({ x: 10, y: 5 }, { x: 2, y: 2 })).toEqual({ x: 8, y: 3 });
    expect(Vec.subtract({ x: 10, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 8, y: 4 });
    expect(Vec.subtract({ x: 10, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 9, y: 3 });
});

test("invert", () => {
    expect(Vec.invert({ x: 10, y: -5 })).toEqual({ x: -10, y: 5 });
    expect(Vec.invert({ x: -10, y: 5 })).toEqual({ x: 10, y: -5 });
});

test("lerp", () => {
    expect(Vec.lerp({ x: 5, y: 10 }, { x: 15, y: 0 }, 0)).toEqual({ x: 5, y: 10 });
    expect(Vec.lerp({ x: 5, y: 10 }, { x: 15, y: 0 }, 1)).toEqual({ x: 15, y: 0 });
    expect(Vec.lerp({ x: 5, y: 10 }, { x: 15, y: 0 }, .5)).toEqual({ x: 10, y: 5 });
});

test("createVector", () => {
    expect(Vec.createVector(5, 10)).toEqual({ x: 5, y: 10 });
});
