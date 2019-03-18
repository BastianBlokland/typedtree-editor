/**
 * @file Can be used to validate if a tree matches a tree-scheme.
 */

import * as Tree from "../tree";
import * as Utils from "../utils";
import * as TreeScheme from "./treescheme";

/** Result of a validation attempt */
export type Result = true | IFailure;

/** Type indicating that validation failed. */
export interface IFailure {
    readonly errorMessage: string;
}

/**
 * Validate if a given tree conforms to the given scheme.
 * @param scheme Scheme to validate against.
 * @param tree Root-node for the tree to validate.
 * @returns True if tree conforms to the scheme otherwise a failure object containing the failure reason.
 */
export function validate(scheme: TreeScheme.IScheme, tree: Tree.INode): Result {
    return validateNode(scheme, scheme.rootAlias, tree);
}

/**
 * Validate if a given node conforms to the given scheme.
 * @param scheme Scheme to validate against.
 * @param alias Alias that node has to be part of.
 * @param node Node to validate.
 * @returns True if the node conforms to the scheme otherwise a failure object containing the failure reason.
 */
export function validateNode(scheme: TreeScheme.IScheme, alias: TreeScheme.IAlias, node: Tree.INode): Result {
    // The 'none' node can be used as a default for all NodeDefinitions, so its always valid.
    if (node.type === Tree.noneNodeType) {
        return true;
    }

    // Validate type.
    if (!alias.containsValue(node.type)) {
        return createInvalidNodeTypeFailure(alias, node.type);
    }

    // Lookup the node-definition from the scheme.
    // Note: This should not fail because we've already validated the alias.
    const nodeDefinition = scheme.getNode(node.type);
    if (nodeDefinition === undefined) {
        throw new Error("Node type not found in scheme");
    }

    // Validate fields.
    for (let index = 0; index < node.fields.length; index++) {
        const field = node.fields[index];
        const fieldDefinition = nodeDefinition.getField(field.name);
        if (fieldDefinition === undefined) {
            return createInvalidFieldFailure(nodeDefinition, field);
        }

        const result = validateField(scheme, fieldDefinition, field);
        if (result !== true) {
            return result;
        }
    }
    return true;
}

/**
 * Validate if a given node conforms to the given scheme.
 * @param scheme Scheme to validate against.
 * @param fieldDefinition Definition that this field has to match.
 * @param field Field to validate.
 * @returns True if the field conforms to the scheme otherwise a failure object containing the failure reason.
 */
export function validateField(
    scheme: TreeScheme.IScheme,
    fieldDefinition: TreeScheme.IFieldDefinition,
    field: Tree.Field): Result {

    // Validate type
    const definitionKind = TreeScheme.getFieldKind(fieldDefinition);
    if (definitionKind !== field.kind) {
        return createInvalidFieldTypeFailure(definitionKind, field);
    }

    // Validate value
    switch (fieldDefinition.valueType) {
        case "string": return true;
        case "number": return true;
        case "boolean": return true;
        default:
            switch (fieldDefinition.valueType.type) {
                case "alias":
                    const alias = fieldDefinition.valueType;
                    if (fieldDefinition.isArray) {
                        const result = (field.value as ReadonlyArray<Tree.INode>).map(node =>
                            validateNode(scheme, alias, node)).
                            find(r => r !== true);
                        return result === undefined ? true : result;
                    } else {
                        return validateNode(scheme, alias, field.value as Tree.INode);
                    }
                case "enum":
                    const enumeration = fieldDefinition.valueType;
                    if (fieldDefinition.isArray) {
                        const result = (field.value as ReadonlyArray<number>).map(value =>
                            validateEnum(enumeration, value)).
                            find(r => r !== true);
                        return result === undefined ? true : result;
                    } else {
                        return validateEnum(enumeration, field.value as number);
                    }
                default:
                    Utils.assertNever(fieldDefinition.valueType);
            }
    }
    throw new Error("Unexpected field-type");
}

function validateEnum(enumeration: TreeScheme.IEnum, value: number): Result {
    if (enumeration.values.some(e => e.value === value)) {
        return true;
    }
    return createInvalidEnumValueFailure(enumeration, value);
}

function createInvalidNodeTypeFailure(expectedAlias: TreeScheme.IAlias, givenType: Tree.NodeType): IFailure {
    return createFailure(`Invalid node type: '${givenType}'. Valid options: [${
        expectedAlias.values.join(", ")}]`);
}

function createInvalidFieldFailure(nodeDefinition: TreeScheme.INodeDefinition, givenField: Tree.Field): IFailure {
    return createFailure(`Unexpected field: '${givenField.name}'. Valid options: [${
        nodeDefinition.fields.map(f => f.name).join(", ")}]`);
}

function createInvalidFieldTypeFailure(expectedKind: Tree.FieldKind, field: Tree.Field): IFailure {
    return createFailure(`Field '${field.name}' has unexpected type: '${field.kind}', expected: '${expectedKind}'`);
}

function createInvalidEnumValueFailure(expectedEnum: TreeScheme.IEnum, givenValue: number): IFailure {
    return createFailure(`Invalid enum value '${givenValue}', Valid options: [${
        expectedEnum.values.map(e => `${e.value}: ${e.name}`).join(", ")}]`);
}

function createFailure(message: string): IFailure {
    return { errorMessage: message };
}
