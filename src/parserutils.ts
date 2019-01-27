export type ParseResult<T> = ParseSuccess<T> | ParseError

export interface ParseSuccess<T> {
    readonly kind: "success"
    readonly value: T;
}
export interface ParseError {
    readonly kind: "error"
    readonly errorMessage: string
}

export async function loadTextFromUrl(url: string): Promise<ParseResult<string>> {
    let fetchResult = await fetch(url);
    if (!fetchResult.ok)
        return createError(`Unable to fetch from: ${url}`);
    // NOTE: Not sure if '.text()' can throw anything, need to check docs
    let text = await fetchResult.text();
    return createSuccess(text);
}

export function loadTextFromFile(file: File): Promise<ParseResult<string>> {
    let fileReader = new FileReader();
    return new Promise((resolve, reject) => {
        fileReader.onload = () => {
            if (fileReader.result != null && typeof fileReader.result == "string")
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

export function createSuccess<T>(value: T): ParseSuccess<T> {
    return { kind: "success", value: value };
}

export function createError(message: string): ParseError {
    return { kind: "error", errorMessage: message };
}
