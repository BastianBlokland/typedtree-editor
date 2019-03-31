/**
 * @file Responsible for serializing tree-scheme's to json.
 */

import * as TreeScheme from "./treescheme";

/**
 * Compose json for the scheme.
 * @param scheme Scheme to create json for.
 * @returns Json representing the given scheme.
 */
export function composeJson(scheme: TreeScheme.IScheme): string {
    const obj = createSchemeObject(scheme);
    return JSON.stringify(obj, undefined, 2);
}

function createSchemeObject(scheme: TreeScheme.IScheme): object {
    const obj: any = {};
    obj.rootAlias = scheme.rootAlias.identifier;
    obj.aliases = scheme.aliases.map(createAliasObject);
    obj.enums = scheme.enums.map(createEnumObject);
    obj.nodes = scheme.nodes.map(createNodeObject);
    return obj;
}

function createAliasObject(alias: TreeScheme.IAlias): object {
    const obj: any = {};
    obj.identifier = alias.identifier;
    obj.values = alias.values;
    return obj;
}

function createEnumObject(enumeration: TreeScheme.IEnum): object {
    const obj: any = {};
    obj.identifier = enumeration.identifier;
    obj.values = enumeration.values;
    return obj;
}

function createNodeObject(node: TreeScheme.INodeDefinition): object {
    const obj: any = {};
    obj.nodeType = node.nodeType;
    obj.fields = node.fields.map(createFieldObject);
    return obj;
}

function createFieldObject(field: TreeScheme.IFieldDefinition): object {
    const obj: any = {};
    obj.name = field.name;
    obj.valueType = createValueTypeString(field.valueType);
    if (field.isArray) {
        obj.isArray = true;
    }
    return obj;
}

function createValueTypeString(valueType: TreeScheme.FieldValueType): string {
    switch (valueType) {
        case "string":
        case "boolean":
        case "number":
            return valueType;
        default:
            return valueType.identifier;
    }
}
