/**
 * @file Responsible for parsing tree-scheme's from json.
 */

import * as TreeScheme from "./treescheme";
import * as Utils from "./utils";

/**
 * Load a scheme as json from the given file or url.
 * @param source Source to get the json from (Can be a file or a url).
 * @returns Scheme or parse failure.
 */
export async function load(source: File | string): Promise<Utils.Parser.ParseResult<TreeScheme.IScheme>> {
    const loadTextResult = await (typeof source === "string" ?
        Utils.Parser.loadTextFromUrl(source) :
        Utils.Parser.loadTextFromFile(source));

    if (loadTextResult.kind === "error") {
        return loadTextResult;
    }
    return parseJson(loadTextResult.value);
}

/**
 * Parse a scheme from a json string.
 * @param jsonString Json to pare.
 * @returns Tree or parse failure.
 */
export function parseJson(jsonString: string): Utils.Parser.ParseResult<TreeScheme.IScheme> {
    let jsonObj: any;
    try {
        jsonObj = JSON.parse(jsonString);
    } catch (e) {
        return Utils.Parser.createError(`Parsing failed: ${e}`);
    }

    try {
        return Utils.Parser.createSuccess(parseScheme(jsonObj));
    } catch (e) {
        return Utils.Parser.createError(`Parsing failed: ${e}`);
    }
}

function parseScheme(obj: any): TreeScheme.IScheme {
    if (obj === undefined || obj === null || typeof obj !== "object") {
        throw new Error("Invalid input obj");
    }

    const rootAliasIdentifier = Utils.Parser.validateString(obj.rootAlias);
    if (rootAliasIdentifier === undefined) {
        throw new Error(`Root-alias identifier '${obj.rootAlias}' of scheme is invalid`);
    }

    return TreeScheme.createScheme(rootAliasIdentifier, schemeBuilder => {
        parseAliases(schemeBuilder, obj);
        parseNodes(schemeBuilder, obj);
    });
}

function parseAliases(schemeBuilder: TreeScheme.ISchemeBuilder, obj: any): void {
    if (!Utils.Parser.isArray(obj.aliases)) {
        return;
    }

    (obj.aliases as any[]).forEach(aliasObj => {

        // Parse identifier
        const identifier = Utils.Parser.validateString(aliasObj.identifier);
        if (identifier === undefined) {
            throw new Error(`Identifier '${identifier}' of alias is invalid`);
        }

        // Parse values
        const values = Utils.Parser.validateStringArray(aliasObj.values);
        if (values === undefined) {
            throw new Error(`Values array '${values}' of alias is invalid`);
        }

        // Add to scheme
        if (schemeBuilder.pushAlias(identifier, values) === undefined) {
            throw new Error(`Unable to push alias '${identifier}', is it a duplicate?`);
        }
    });
}

function parseNodes(schemeBuilder: TreeScheme.ISchemeBuilder, obj: any): void {
    if (!Utils.Parser.isArray(obj.nodes)) {
        return;
    }

    (obj.nodes as any[]).forEach(nodeObj => {

        // Parse identifier
        const nodeType = Utils.Parser.validateString(nodeObj.nodeType);
        if (nodeType === undefined) {
            throw new Error(`NodeType '${nodeType}' of node is invalid`);
        }

        schemeBuilder.pushNodeDefinition(nodeType, nodeBuilder => {

            // Parse fields
            if (!Utils.Parser.isArray(nodeObj.fields)) {
                return;
            }
            (nodeObj.fields as any[]).forEach(fieldObj => {
                const name = Utils.Parser.validateString(fieldObj.name);
                if (name === undefined) {
                    throw new Error(`Node '${nodeType}' has field that is missing a name`);
                }

                const valueType = parseValueType(schemeBuilder, fieldObj.valueType);
                const isArray = Utils.Parser.isBoolean(fieldObj.isArray) ? fieldObj.isArray as boolean : false;

                if (!nodeBuilder.pushField(name, valueType, isArray)) {
                    throw new Error(`Unable to push field '${name}' on node '${nodeType}', is it a duplicate?`);
                }
            });
        });
    });
}

function parseValueType(schemeBuilder: TreeScheme.ISchemeBuilder, obj: any): TreeScheme.FieldValueType {
    const str = Utils.Parser.validateString(obj);
    if (str === undefined) {
        throw new Error("Invalid value type");
    }
    switch (str) {
        case "string":
        case "number":
        case "boolean":
            return str;
        default:
            const alias = schemeBuilder.getAlias(str);
            if (alias === undefined) {
                throw new Error(`No alias found with identifier: '${str}'`);
            }
            return alias;
    }
}
