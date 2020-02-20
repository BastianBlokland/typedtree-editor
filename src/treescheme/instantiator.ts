/**
 * @file Responsible for instantiating tree nodes from a scheme.
 */

import * as Tree from "../tree";
import * as Utils from "../utils";
import * as TreeScheme from "./treescheme";
import * as TreeSchemeValidator from "./validator";

/**
 * Create a duplicate of a existing tree but add any fields that the scheme specifies but the tree
 * does not have. Newly created fields have their values set to default.
 * @param scheme Scheme to get definitions for the nodes from.
 * @param tree Original tree to create the duplicate from.
 * @returns Newly created (immutable) tree that contains all fields from the scheme.
 */
export function duplicateWithMissingFields(scheme: TreeScheme.IScheme, tree: Tree.INode): Tree.INode {
    // Before adding any fields we validate that the existing fields comply with the scheme.
    const validateResult = TreeSchemeValidator.validate(scheme, tree);
    if (validateResult !== true) {
        throw new Error("Existing tree does not conform to the given scheme");
    }
    // Recursively re-create the tree and add missing fields.
    return instantiateNode(tree);

    function instantiateNode(node: Tree.INode): Tree.INode {
        // If node is of type 'none' it cannot have any data and we leave it alone.
        if (node.type === Tree.noneNodeType) {
            return node;
        }

        // Get the definition for this node from the scheme.
        const definition = scheme.getNode(node.type);
        if (definition === undefined) {
            throw new Error(`Unable to find definition for node-type: ${node.type}`);
        }
        return Tree.createNode(definition.nodeType, b => {
            // Copy fields from the original if it has them, otherwise create defaults.
            definition.fields.forEach(f => {
                const orgField = node.getField(f.name);
                if (orgField !== undefined) {
                    // 'node' and 'nodeArray' need deep-copying, the rest we can use as-is.
                    switch (orgField.kind) {
                        case "node":
                            b.pushNodeField(f.name, instantiateNode(orgField.value));
                            break;
                        case "nodeArray":
                            b.pushNodeArrayField(f.name, orgField.value.map(instantiateNode));
                            break;
                        default:
                            b.pushField(orgField);
                            break;
                    }
                } else {
                    // Not found in the original: create default.
                    b.pushField(instantiateDefaultField(f));
                }
            });
        });
    }
}

/**
 * Change the type of a node. Compatible fields will be used from the old-node, for missing / non-compatible
 * fields new ones will be created with values set to default.
 * @param scheme Scheme to get definitions for the type from.
 * @param node Node to base the new node on.
 * @param newNodeType Type of the new node to create.
 * @returns Newly created (immutable) node.
 */
export function changeNodeType(scheme: TreeScheme.IScheme, node: Tree.INode, newNodeType: Tree.NodeType): Tree.INode {
    if (newNodeType === Tree.noneNodeType) {
        return Tree.createNoneNode();
    }
    const newNodeDefinition = scheme.getNode(newNodeType);
    if (newNodeDefinition === undefined) {
        throw new Error(`New node-type ${newNodeType} cannot be found in the given scheme`);
    }
    return Tree.createNode(newNodeType, b => {
        newNodeDefinition.fields.forEach(f => {
            /* If the field of the original node is compatible then use that, otherwise create a new
            default field. */
            const orgField = node.getField(f.name);
            if (orgField !== undefined && TreeSchemeValidator.validateField(scheme, f, orgField) === true) {
                b.pushField(orgField);
            } else {
                const defaultField = instantiateDefaultField(f);
                b.pushField(defaultField);
            }
        });
    });
}

/**
 * Instantiate a (immutable) node with all fields set to their default values.
 * @param scheme Scheme to get definitions for the type from.
 * @param nodeType Type of the node to instantiate.
 * @returns Newly created (immutable) node.
 */
export function instantiateDefaultNodeType(scheme: TreeScheme.IScheme, nodeType: Tree.NodeType): Tree.INode {
    if (nodeType === Tree.noneNodeType) {
        return Tree.createNoneNode();
    }
    const definition = scheme.getNode(nodeType);
    if (definition === undefined) {
        throw new Error(`Unable to find definition for nodetype: ${nodeType}`);
    }
    return instantiateDefaultNode(definition);
}

/**
 * Instantiate a (immutable) node with all fields set to their default values.
 * @param nodeDefinition Definition of the node to instantiate.
 * @returns Newly created node.
 */
export function instantiateDefaultNode(nodeDefinition: TreeScheme.INodeDefinition): Tree.INode {
    return Tree.createNode(nodeDefinition.nodeType, b => {
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
            switch (fieldDefinition.valueType.type) {
                case "alias":
                    return fieldDefinition.isArray ?
                        { kind: "nodeArray", name: fieldDefinition.name, value: [] } :
                        { kind: "node", name: fieldDefinition.name, value: Tree.createNoneNode() };
                case "enum":
                    return fieldDefinition.isArray ?
                        { kind: "numberArray", name: fieldDefinition.name, value: [] } :
                        {
                            kind: "number",
                            name: fieldDefinition.name,
                            value: fieldDefinition.valueType.values[0].value,
                        };
                default: Utils.assertNever(fieldDefinition.valueType);
            }
    }
    throw new Error("Unexpected value type");
}

/**
 * Create a new default element for a given FieldValueType.
 * @param valueType FieldValueType to create a new element for.
 * @returns Newly created default element.
 */
export function createNewElement<T extends TreeScheme.FieldValueType>(valueType: T): TreeScheme.TreeType<T> {
    const typedValueType = valueType as TreeScheme.FieldValueType;
    switch (typedValueType) {
        case "string": return "" as TreeScheme.TreeType<T>;
        case "number": return 0 as TreeScheme.TreeType<T>;
        case "boolean": return false as TreeScheme.TreeType<T>;
        default:
            switch (typedValueType.type) {
                case "alias": return Tree.createNoneNode() as TreeScheme.TreeType<T>;
                case "enum": return typedValueType.values[0].value as TreeScheme.TreeType<T>;
                default: Utils.assertNever(typedValueType);
            }
    }
    throw new Error("Unexpected value type");
}
