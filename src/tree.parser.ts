/**
 * @file Responsible for parsing tree's from json.
 */

import * as ParserUtils from "./parserutils";
import { createError, createSuccess, ParseResult } from "./parserutils";
import * as Tree from "./tree";

/**
 * Load a tree as json from the given file or url.
 * @param source Source to get the json from (Can be a file or a url).
 * @returns Tree or parse failure.
 */
export async function load(source: File | string): Promise<ParseResult<Tree.INode>> {
    const loadTextResult = await (typeof source === "string" ?
        ParserUtils.loadTextFromUrl(source) :
        ParserUtils.loadTextFromFile(source));

    if (loadTextResult.kind === "error") {
        return loadTextResult;
    }
    return parseJson(loadTextResult.value);
}

/**
 * Parse a tree from a json string.
 * @param jsonString Json to pare.
 * @returns Tree or parse failure.
 */
export function parseJson(jsonString: string): ParseResult<Tree.INode> {
    let jsonObj: any;
    try {
        jsonObj = JSON.parse(jsonString);
    } catch (e) {
        return createError(`Parsing failed: ${e}`);
    }

    try {
        return createSuccess(parseNode(jsonObj));
    } catch (e) {
        return createError(`Parsing failed: ${e}`);
    }
}

const anonymousNodeType: Tree.NodeType = "Anonymous";

function parseNode(obj: any): Tree.INode {
    if (obj === undefined || obj === null || typeof obj !== "object") {
        throw new Error("Invalid input obj");
    }

    let type: any = obj.$type;
    if (type === undefined || type === null || typeof type !== "string") {
        type = anonymousNodeType;
    }

    return Tree.createNode(type, b => {
        Object.keys(obj).forEach(key => {
            if (key !== "$type") {
                const field = parseField(key, obj[key]);
                if (field !== undefined) {
                    b.pushField(field);
                }
            }
        });
    });
}

function parseField(name: string, value: any): Tree.Field | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    switch (typeof value) {
        case "string": return { kind: "string", name, value };
        case "number": return { kind: "number", name, value };
        case "boolean": return { kind: "boolean", name, value };
        case "object": {
            if (ParserUtils.isArray(value)) {
                const array: any[] = value;
                if (array.length === 0) {
                    return undefined;
                }

                const arrayType = getArrayType(array);
                switch (arrayType) {
                    case "string": return { kind: "stringArray", name, value: array };
                    case "number": return { kind: "numberArray", name, value: array };
                    case "boolean": return { kind: "booleanArray", name, value: array };
                    case "object": {
                        const nodeArray: Tree.INode[] = array.map(n => parseNode(n));
                        return { kind: "nodeArray", name, value: nodeArray };
                    }
                    default: throw new Error(`Unexpected array element type: ${arrayType}`);
                }
            } else {
                return { kind: "node", name, value: parseNode(value) };
            }
        }
    }
    throw new Error(`Unexpected type: ${typeof value}`);
}

function getArrayType(array: any[]): string {
    if (array.length === 0) {
        throw new Error("Unable to determine type of empty array");
    }
    const type = typeof array[0];
    for (let i: number = 1; i < array.length; i++) {
        if (typeof array[i] !== type) {
            throw new Error("Array consists of mixed types");
        }
    }
    return type;
}
