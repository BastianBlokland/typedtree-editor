/**
 * @file Responsible for parsing tree-pack's from json.
 */

import * as Tree from "../tree";
import * as TreeScheme from "../treescheme";
import * as Utils from "../utils";
import * as TreePack from "./treepack";

/**
 * Load a tree-pack as json from the given file or url.
 * @param source Source to get the json from (Can be a file or a url).
 * @returns TreePack or parse failure.
 */
export async function load(source: File | string): Promise<Utils.Parser.ParseResult<TreePack.ITreePack>> {
    const loadTextResult = await (typeof source === "string" ?
        Utils.Parser.loadTextFromUrl(source) :
        Utils.Parser.loadTextFromFile(source));

    if (loadTextResult.kind === "error") {
        return loadTextResult;
    }
    return parseJson(loadTextResult.value);
}

/**
 * Parse a tree-pack from a json string.
 * @param jsonString Json to pare.
 * @returns TreePack or parse failure.
 */
export function parseJson(jsonString: string): Utils.Parser.ParseResult<TreePack.ITreePack> {
    let jsonObj: any;
    try {
        jsonObj = JSON.parse(jsonString);
    } catch (e) {
        return Utils.Parser.createError(`Parsing failed: ${e}`);
    }

    try {
        return Utils.Parser.createSuccess(parseTreePack(jsonObj));
    } catch (e) {
        return Utils.Parser.createError(`Parsing failed: ${e}`);
    }
}

/**
 * Parse a tree-pack from a object.
 * @param object Object to parse.
 * @returns TreePack or parse failure.
 */
export function parseObject(object: any): Utils.Parser.ParseResult<TreePack.ITreePack> {
    try {
        return Utils.Parser.createSuccess(parseTreePack(object));
    } catch (e) {
        return Utils.Parser.createError(`Parsing failed: ${e}`);
    }
}

function parseTreePack(obj: any): TreePack.ITreePack {
    if (obj === undefined || obj === null || typeof obj !== "object") {
        throw new Error("Invalid input obj");
    }

    const schemeParseResult = TreeScheme.Parser.parseObject(obj.scheme);
    if (schemeParseResult.kind !== "success") {
        throw new Error(`Invalid scheme: '${schemeParseResult.errorMessage}'`);
    }

    const treeParseResult = Tree.Parser.parseObject(obj.tree);
    if (treeParseResult.kind !== "success") {
        throw new Error(`Invalid tree: '${treeParseResult.errorMessage}'`);
    }

    return TreePack.createPack(schemeParseResult.value, treeParseResult.value);
}
