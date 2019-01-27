import * as Tree from "./tree";
import * as Utils from "./utils";

export function composeJson(node: Tree.Node): string {
    let obj = createObject(node);
    return JSON.stringify(obj, undefined, 2);
}

function createObject(node: Tree.Node): Object {
    let obj: any = {};
    obj.$type = node.type;
    node.fields.forEach(field => {
        switch (field.kind) {
            case "string":
            case "number":
            case "boolean":
            case "stringArray":
            case "numberArray":
            case "booleanArray":
                obj[field.name] = field.value;
                break;
            case "node":
                obj[field.name] = createObject(field.value);
                break;
            case "nodeArray":
                obj[field.name] = field.value.map(child => createObject(child));
                break;
            default:
                Utils.assertNever(field);
        }
    });
    return obj;
}
