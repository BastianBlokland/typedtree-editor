/**
 * @file 2D vector that can be used to represent positions, offsets and sizes.
 */

import * as Misc from "./misc";

/** Vector2 that represents a position. */
export type Position = IVector2;

/** Vector2 that represents a size. */
export type Size = IVector2;

/** Vector containing two elements (x & y). */
export interface IVector2 {
    readonly x: number;
    readonly y: number;
}

/** Vector containing (0, 0). */
export const zeroVector: IVector2 = { x: 0, y: 0 };

/** Vector containing (1, 1). */
export const oneVector: IVector2 = { x: 1, y: 1 };

/** Vector containing (0, 1). */
export const upVector: IVector2 = { x: 0, y: 1 };

/** Vector containing (0, -1). */
export const downVector: IVector2 = { x: 0, y: -1 };

/** Vector containing (-1, 0). */
export const leftVector: IVector2 = { x: -1, y: 0 };

/** Vector containing (1, 0). */
export const rightVector: IVector2 = { x: 1, y: 0 };

/**
 * Half the given vector (Halves all components).
 * @param vector Vector to half.
 * @returns Half of the given vector.
 */
export function half(vector: IVector2): IVector2 {
    return multiply(vector, .5);
}

/**
 * Multiply the given vector (Multiplies all components).
 * @param vector Vector to multiply.
 * @param amount Amount to multiply by.
 * @returns Multiplied vector.
 */
export function multiply(vector: IVector2, amount: number | IVector2): IVector2 {
    if (typeof amount === "number") {
        return createVector(vector.x * amount, vector.y * amount);
    }

    return createVector(vector.x * amount.x, vector.y * amount.y);
}

/**
 * Divide the given vector (Divides all components).
 * @param vector Vector to divide.
 * @param amount Amount to divide by.
 * @returns Divided vector.
 */
export function divide(vector: IVector2, amount: number | IVector2): IVector2 {
    if (typeof amount === "number") {
        return createVector(vector.x / amount, vector.y / amount);
    }

    return createVector(vector.x / amount.x, vector.y / amount.y);
}

/**
 * Add the given amount to the vector (Adds all components).
 * @param vector Vector to add to.
 * @param amount Amount to add.
 * @returns Added vector.
 */
export function add(vector: IVector2, amount: number | IVector2): IVector2 {
    if (typeof amount === "number") {
        return createVector(vector.x + amount, vector.y + amount);
    }

    return createVector(vector.x + amount.x, vector.y + amount.y);
}

/**
 * Subtract the given amount from the vector (Subtracts all components).
 * @param vector Vector to subtracts from.
 * @param amount Amount to subtract.
 * @returns Subtracted vector.
 */
export function subtract(vector: IVector2, amount: number | IVector2): IVector2 {
    if (typeof amount === "number") {
        return createVector(vector.x - amount, vector.y - amount);
    }

    return createVector(vector.x - amount.x, vector.y - amount.y);
}

/**
 * Invert the given vector (Invert all components).
 * @param vector Vector to invert.
 * @returns Inverted vector.
 */
export function invert(vector: IVector2): IVector2 {
    return createVector(-vector.x, -vector.y);
}

/**
 * Linearly interpolate between the given vectors.
 * @param a Vector to start interpolating from.
 * @param b Vector to interpolate to.
 * @param t Progress between a and b (0 = a, 1 = b).
 * @returns Interpolated vector.
 */
export function lerp(vectorA: IVector2, vectorB: IVector2, frac: number): IVector2 {
    return createVector(Misc.lerp(vectorA.x, vectorB.x, frac), Misc.lerp(vectorA.y, vectorB.y, frac));
}

/**
 * Create a vector containing given components.
 * @param x X component.
 * @param y Y component.
 * @returns Vector from the given components.
 */
export function createVector(x: number, y: number): IVector2 {
    return { x, y };
}
