/**
 * @file Responsible for serializing tree's to json.
 */

import * as Tree from "./tree";
import * as Utils from "./utils";

/**
 * Compose json for the given node (and its children).
 * @param node Node to create json for.
 * @returns Json representing the given node.
 */
export function composeJson(node: Tree.Node): string {
    const obj = createObject(node);
    return JSON.stringify(obj, undefined, 2);
}

function createObject(node: Tree.Node): Object {
    const obj: any = {};
    obj.$type = node.type;
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
                obj[field.name] = createObject(field.value);
                break;
            case "nodeArray":
                if (field.value.length > 0) {
                    obj[field.name] = field.value.map(child => createObject(child));
                }
                break;
            default:
                Utils.assertNever(field);
        }
    });
    return obj;
}
