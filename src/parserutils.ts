/** Result that is returned from a parse operation, can either be a success or an error. */
export type ParseResult<T> = ParseSuccess<T> | ParseError

/** Type indicating a successful parse. */
export interface ParseSuccess<T> {
    readonly kind: "success"
    readonly value: T;
}

/** Type indicating that an error ocurred while parsing. */
export interface ParseError {
    readonly kind: "error"
    readonly errorMessage: string
}

/**
 * Download text from the given url.
 * @param url To download from.
 * @returns Resulting text or an error.
 */
export async function loadTextFromUrl(url: string): Promise<ParseResult<string>> {
    const fetchResult = await fetch(url);
    if (!fetchResult.ok)
        return createError(`Unable to fetch from: ${url}`);
    // NOTE: Not sure if '.text()' can throw anything, need to check docs
    const text = await fetchResult.text();
    return createSuccess(text);
}

/**
 * Load text from a file
 * @param file To load from.
 * @returns Resulting text or an error.
 */
export function loadTextFromFile(file: File): Promise<ParseResult<string>> {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
        fileReader.onload = () => {
            if (fileReader.result !== null && typeof fileReader.result === "string")
                resolve(createSuccess(fileReader.result));
            else
                resolve(createError("File does not contain text"));
        };
        fileReader.onerror = () => {
            fileReader.abort();
            resolve(createError(`Failed to load file: ${file.name}`))
        };
        fileReader.readAsText(file);
    });
}

/**
 * Construct a parse-result representing a successful parse.
 * @param value Successfully parsed value.
 * @returns ParseResult indicating a successful parse.
 */
export function createSuccess<T>(value: T): ParseSuccess<T> {
    return { kind: "success", value: value };
}

/**
 * Construct a parse-result representing an error.
 * @param message Message to include with the error
 * @returns ParseResult indicating an error.
 */
export function createError(message: string): ParseError {
    return { kind: "error", errorMessage: message };
}

/**
 * Check if given object is a string.
 * @param obj Object to check.
 * @returns True if obj is a string otherwise false.
 */
export function isString(obj: any): boolean {
    return obj !== undefined && obj !== null && typeof obj === "string";
}

/**
 * Check if given object is a boolean.
 * @param obj Object to check.
 * @returns True if obj is a boolean otherwise false.
 */
export function isBoolean(obj: any): boolean {
    return obj !== undefined && obj !== null && typeof obj === "boolean";
}

/**
 * Check if given object is an array
 * @param obj Object to check.
 * @returns True if the obj is an array otherwise false.
 */
export function isArray(obj: any): boolean {
    return obj !== undefined && obj !== null && Array.isArray(obj);
}

/**
 * Validate if an object is a string.
 * @param obj Input to validate.
 * @returns A string if obj was a string otherwise undefined.
 */
export function validateString(obj: any): string | undefined {
    if (obj === undefined || obj === null || typeof obj !== "string")
        return undefined;
    return obj;
}

/**
 * Validate if an object is a boolean.
 * @param obj Input to validate.
 * @returns A boolean if obj was a boolean otherwise undefined.
 */
export function validateBoolean(obj: any): boolean | undefined {
    if (obj === undefined || obj === null || typeof obj !== "boolean")
        return undefined;
    return obj;
}

/**
 * Validate if an object is a string array.
 * @param obj Input to validate.
 * @returns String array if the obj was a string array otherwise undefined.
 */
export function validateStringArray(obj: any): string[] | undefined {
    if (!isArray(obj))
        return undefined;
    const array = <any[]>obj;
    if (!array.every(e => typeof e === "string"))
        return undefined;
    return <string[]>array;
}
