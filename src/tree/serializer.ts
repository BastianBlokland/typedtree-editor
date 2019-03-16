/**
 * @file Responsible for serializing tree's to json.
 */

import * as Utils from "../utils";
import * as Tree from "./tree";

/**
 * Compose json for the given node (and its children).
 * @param node Node to create json for.
 * @returns Json representing the given node.
 */
export function composeJson(node: Tree.INode): string {
    const obj = createObject(node);
    return JSON.stringify(obj, undefined, 2);
}

function createObject(node: Tree.INode): object {
    if (node.type === Tree.noneNodeType) {
        throw new Error(`Nodes of type ${node.type} cannot be serialized`);
    }

    const obj: any = {};
    if (node.type !== Tree.anonymousNodeType) {
        obj.$type = node.type;
    }
    node.fields.forEach(field => {
        switch (field.kind) {
            case "string":
            case "number":
            case "boolean":
                obj[field.name] = field.value;
                break;
            case "stringArray":
            case "numberArray":
            case "booleanArray":
                if (field.value.length > 0) {
                    obj[field.name] = field.value;
                }
                break;
            case "node":
                if (field.value.type !== Tree.noneNodeType) {
                    obj[field.name] = createObject(field.value);
                }
                break;
            case "nodeArray":
                if (field.value.length > 0) {
                    obj[field.name] = field.value.
                        filter(child => child.type !== Tree.noneNodeType).
                        map(child => createObject(child));
                }
                break;
            default:
                Utils.assertNever(field);
        }
    });
    return obj;
}
