/**
 * @file Can be used to validate if a tree matches a tree-scheme.
 */

import * as Utils from "./utils";
import * as TreeScheme from "./treescheme";
import * as Tree from "./tree";

/** Result of a validation attempt */
export type Result = true | Failure;

/** Type indicating that validation failed. */
export interface Failure {
    readonly errorMessage: string
}

/**
 * Validate if a given tree conforms to the given scheme.
 * @param scheme Scheme to validate against.
 * @param tree Root-node for the tree to validate.
 * @returns True if tree conforms to the scene otherwise a failure object containing the failure reason.
 */
export function validate(scheme: TreeScheme.Scheme, tree: Tree.Node): Result {
    return validateNode(scheme, scheme.rootAlias, tree);
}

function validateNode(scheme: TreeScheme.Scheme, alias: TreeScheme.Alias, node: Tree.Node): Result {
    // Validate type.
    if (!alias.containsValue(node.type))
        return createInvalidNodeTypeFailure(alias, node.type);

    // Lookup the node-definition from the scheme.
    // Note: This should not fail because we've already validated the alias.
    const nodeDefinition = scheme.getNode(node.type);
    if (nodeDefinition === undefined)
        throw new Error("Node type not found in scheme");

    // Validate fields.
    for (let index = 0; index < node.fields.length; index++) {
        const field = node.fields[index];
        const fieldDefinition = nodeDefinition.getField(field.name);
        if (fieldDefinition === undefined)
            return createInvalidFieldFailure(nodeDefinition, field);

        const result = validateField(scheme, fieldDefinition, field);
        if (result !== true)
            return result;
    }
    return true;
}

function validateField(
    scheme: TreeScheme.Scheme,
    fieldDefinition: TreeScheme.FieldDefinition,
    field: Tree.Field): Result {

    // Validate type
    const definitionKind = TreeScheme.getFieldKind(fieldDefinition);
    if (definitionKind !== field.kind)
        return createInvalidFieldTypeFailure(definitionKind, field);

    // Validate value
    switch (field.kind) {
        case "string": return true;
        case "number": return true;
        case "boolean": return true;
        case "node": return validateNode(scheme, <TreeScheme.Alias>fieldDefinition.valueType, field.value);
        case "stringArray": return true;
        case "numberArray": return true;
        case "booleanArray": return true;
        case "nodeArray":
            const result = field.value.map(node =>
                validateNode(scheme, <TreeScheme.Alias>fieldDefinition.valueType, node)).
                find(r => r !== true);
            return result === undefined ? true : result;
        default: Utils.assertNever(field);
    }

    throw new Error("Unexpected field-type");
}

function createInvalidNodeTypeFailure(expectedAlias: TreeScheme.Alias, givenType: Tree.NodeType): Failure {
    return createFailure(`Invalid node type: '${givenType}'. Valid options: [${
        expectedAlias.values.join(", ")}]`);
}

function createInvalidFieldFailure(nodeDefinition: TreeScheme.NodeDefinition, givenField: Tree.Field): Failure {
    return createFailure(`Unexpected field: '${givenField.name}'. Valid options: [${
        nodeDefinition.fields.map(f => f.name).join(", ")}]`);
}

function createInvalidFieldTypeFailure(expectedKind: Tree.FieldKind, field: Tree.Field): Failure {
    return createFailure(`Field '${field.name}' has unexpected type: '${field.kind}', expected: '${expectedKind}'`);
}

function createFailure(message: string): Failure {
    return { errorMessage: message };
}
