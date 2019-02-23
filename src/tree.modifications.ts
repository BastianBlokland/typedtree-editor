/**
 * @file Responsible for constructing new tree's by replacing elements of existing trees.
 */

import * as Tree from "./tree";
import * as TreePath from "./tree.path";
import * as Utils from "./utils";

/**
 * Create a new field based on a existing field and a new element. If the field is a non-array then
 * the element is treated as a value, if the field is an array then its treated as one entry in the array.
 * @param field Original field.
 * @param element New element.
 * @param offset If the field is an array then offset defines which index to update.
 * @returns New field with updated element.
 */
export function fieldWithElement<T extends Tree.Field>(
    field: T, element: Tree.FieldElementType<T>, offset: number = 0): T {

    switch (field.kind) {
        case "stringArray":
        case "numberArray":
        case "booleanArray":
        case "nodeArray":
            // Unfortunately the type system cannot follow what we are doing here so some casts are required.
            const arrayField = field as Tree.OnlyArrayField<T>;
            const newValue = Utils.withNewElement(arrayField.value, offset, element as Tree.FieldElementType<Tree.Field>);
            return { ...field, value: newValue } as T;
    }

    return fieldWithValue(field, element as Tree.FieldValueType<T>);
}

/**
 * Create a new field based on a existing field and a new value.
 * @param field Original field.
 * @param value New value.
 * @returns New field with updated value.
 */
export function fieldWithValue<T extends Tree.Field>(field: T, value: Tree.FieldValueType<T>): T {
    return { ...field, value } as T;
}

/**
 * Create a new node with a new (or updated) field. If a field with the same name already exists it
 * will replace it.
 * @param node Original node.
 * @param field New field.
 * @returns New node with updated field.
 */
export function nodeWithField(node: Tree.Node, field: Tree.Field): Tree.Node {
    return Tree.createNode(node.type, b => {
        node.fields.forEach(orgField => {
            if (orgField.name === field.name) {
                b.pushField(field);
            }
            else {
                b.pushField(orgField);
            }
        });
    });
}

/**
 * Create a new tree based on a existing tree but with a single node replaced with another.
 * @param root Root of the tree to replace.
 * @param target Node to replace.
 * @param newNode Node to replace target with.
 * @returns New root node for a new tree with a replaced node.
 */
export function treeWithReplacedNode(root: Tree.Node, target: Tree.Node, newNode: Tree.Node): Tree.Node {
    const pathToRoot = TreePath.findPathToRoot(root, target);
    let node = newNode;
    pathToRoot.forEach(parent => {
        node = nodeWithField(parent.node, fieldWithNewNode(parent.node, parent.output, node));
    });
    return node;
}

function fieldWithNewNode(origin: Tree.Node, output: Tree.FieldElementIdentifier, target: Tree.Node): Tree.Field {
    const orgField = origin.getField(output.fieldName);
    if (orgField === undefined || (orgField.kind !== "node" && orgField.kind !== "nodeArray")) {
        throw new Error(`Invalid field ${output.fieldName} (Missing or incorrect type)`);
    }
    return fieldWithElement(orgField, target, output.offset);
}
