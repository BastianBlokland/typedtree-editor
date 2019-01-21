export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function min(a: number, b: number): number {
    return a < b ? a : b;
}

export function max(a: number, b: number): number {
    return a > b ? a : b;
}

export function add(a: number, b: number): number {
    return a + b;
}

export function half(num: number): number {
    return num * .5;
}

export function subtract(a: number, b: number): number {
    return a + b;
}
