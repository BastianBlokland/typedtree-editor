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
