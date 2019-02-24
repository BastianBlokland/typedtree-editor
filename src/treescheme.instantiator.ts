/**
 * @file Responsible for instantiating tree nodes from a scheme.
 */

import * as Tree from "./tree";
import * as TreeScheme from "./treescheme";

/**
 * Instantiate a (immutable) node with all fields set to their default values.
 * @param nodeDefinition Definition of the node to instantiate.
 * @returns Newly created node.
 */
export function instantiateDefaultNode(nodeDefinition: TreeScheme.INodeDefinition): Tree.INode {
    return Tree.createNode(nodeDefinition.identifier, b => {
        nodeDefinition.fields.forEach(f => {
            const field = instantiateDefaultField(f);
            b.pushField(field);
        });
    });
}

/**
 * Instantiate a (immutable) field with value set to default.
 * @param fieldDefinition Definition to instantiate.
 * @returns Newly instantiated (immutable) default field.
 */
export function instantiateDefaultField(fieldDefinition: TreeScheme.IFieldDefinition): Tree.Field {
    switch (fieldDefinition.valueType) {
        case "string":
            return fieldDefinition.isArray ?
                { kind: "stringArray", name: fieldDefinition.name, value: [] } :
                { kind: "string", name: fieldDefinition.name, value: "" };
        case "number":
            return fieldDefinition.isArray ?
                { kind: "numberArray", name: fieldDefinition.name, value: [] } :
                { kind: "number", name: fieldDefinition.name, value: 0 };
        case "boolean":
            return fieldDefinition.isArray ?
                { kind: "booleanArray", name: fieldDefinition.name, value: [] } :
                { kind: "boolean", name: fieldDefinition.name, value: false };
        default:
            return fieldDefinition.isArray ?
                { kind: "nodeArray", name: fieldDefinition.name, value: [] } :
                { kind: "node", name: fieldDefinition.name, value: Tree.createNoneNode() };
    }
}
