import * as Tree from "./tree";
import * as Utils from "./utils";
import * as ParserUtils from "./parserutils";
import { ParseResult, createError, createSuccess } from "./parserutils";

export async function load(source: File | string): Promise<ParseResult<Tree.Node>> {
    let loadTextResult = await (typeof source == "string" ?
        ParserUtils.loadTextFromUrl(source) :
        ParserUtils.loadTextFromFile(source));

    if (loadTextResult.kind == "error")
        return loadTextResult;
    return parseJson(loadTextResult.value);
}

export function parseJson(jsonString: string): ParseResult<Tree.Node> {
    let jsonObj: any = undefined;
    try {
        jsonObj = JSON.parse(jsonString);
    } catch (e) {
        return createError(`Parsing failed: ${e}`);
    }

    try {
        return createSuccess(parseNode(jsonObj));
    }
    catch (e) {
        return createError(`Parsing failed: ${e}`);
    }
}

function parseNode(obj: any): Tree.Node {
    if (obj == undefined || obj == null || typeof obj != "object")
        throw new Error("Invalid input obj");

    let type: any = obj.$type;
    if (type == undefined || type == null || typeof type != "string")
        throw new Error("Object is missing a '$type' key");

    return Tree.createNode(type, b => {
        Object.keys(obj).forEach(key => {
            if (key != "$type")
                b.pushField(parseField(key, obj[key]));
        });
    });
}

function parseField(name: string, value: any): Tree.Field {
    if (value == undefined || value == null)
        throw new Error(`Invalid value for key: '${name}'`);

    switch (typeof value) {
        case "string": return { kind: "string", name: name, value: value };
        case "number": return { kind: "number", name: name, value: value };
        case "boolean": return { kind: "boolean", name: name, value: value };
        case "object": {
            if (Utils.isArray(value)) {
                let array: any[] = value;
                let arrayType = getArrayType(array);
                switch (arrayType) {
                    case "string": return { kind: "stringArray", name: name, value: array };
                    case "number": return { kind: "numberArray", name: name, value: array };
                    case "boolean": return { kind: "booleanArray", name: name, value: array };
                    case "object": {
                        let nodeArray: Tree.Node[] = array.map(n => parseNode(n));
                        return { kind: "nodeArray", name: name, value: nodeArray };
                    }
                    default: throw new Error(`Unexpected array element type: ${arrayType}`);
                }
            }
            else {
                return { kind: "node", name: name, value: parseNode(value) };
            }
        }
    }
    throw new Error(`Unexpected type: ${typeof value}`);
}

function getArrayType(array: any[]): string {
    if (array.length == 0)
        throw new Error("Unable to determine type of empty array");
    let type = typeof array[0];
    for (let i: number = 1; i < array.length; i++) {
        if (typeof array[i] != type)
            throw new Error("Array consists of mixed types");
    }
    return type;
}
