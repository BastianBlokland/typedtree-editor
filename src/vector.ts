import * as Utils from "./utils";

export type Position = Vector2;

export type Size = Vector2;

export interface Vector2 {
    readonly x: number
    readonly y: number
}

export const zeroVector: Vector2 = { x: 0, y: 0 }
export const oneVector: Vector2 = { x: 1, y: 1 }
export const upVector: Vector2 = { x: 0, y: 1 }
export const downVector: Vector2 = { x: 0, y: -1 }
export const leftVector: Vector2 = { x: -1, y: 0 }
export const rightVector: Vector2 = { x: 1, y: 0 }

export function half(vector: Vector2): Vector2 {
    return multiply(vector, .5);
}

export function multiply(vector: Vector2, amount: number | Vector2): Vector2 {
    if (typeof amount == "number")
        return createVector(vector.x * amount, vector.y * amount);

    return createVector(vector.x * amount.x, vector.y * amount.y);
}

export function divide(vector: Vector2, amount: number | Vector2): Vector2 {
    if (typeof amount == "number")
        return createVector(vector.x / amount, vector.y / amount);

    return createVector(vector.x / amount.x, vector.y / amount.y);
}

export function add(vector: Vector2, amount: number | Vector2): Vector2 {
    if (typeof amount == "number")
        return createVector(vector.x + amount, vector.y + amount);

    return createVector(vector.x + amount.x, vector.y + amount.y);
}

export function subtract(vector: Vector2, amount: number | Vector2): Vector2 {
    if (typeof amount == "number")
        return createVector(vector.x - amount, vector.y - amount);

    return createVector(vector.x - amount.x, vector.y - amount.y);
}

export function invert(vector: Vector2): Vector2 {
    return createVector(-vector.x, -vector.y);
}

export function lerp(vectorA: Vector2, vectorB: Vector2, frac: number): Vector2 {
    return createVector(Utils.lerp(vectorA.x, vectorB.x, frac), Utils.lerp(vectorA.y, vectorB.y, frac));
}

export function createVector(x: number, y: number): Vector2 {
    return { x: x, y: y };
}
