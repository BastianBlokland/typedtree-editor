/**
 * @file Responsible for serializing tree-pack's to json.
 */

import * as Tree from "../tree";
import * as TreeScheme from "../treescheme";
import * as TreePack from "./treepack";

/**
 * Compose json for the pack.
 * @param pack Pack to create json for.
 * @param prettyFormat Should the output be pretty formatted.
 * @returns Json representing the given pack.
 */
export function composeJson(pack: TreePack.ITreePack, prettyFormat: boolean = true): string {
    const obj = createObject(pack);
    return JSON.stringify(obj, undefined, prettyFormat ? 2 : 0);
}

/**
 * Compose a serializable object for the pack.
 * @param scheme Pack to create an object for.
 * @returns object representing the given pack.
 */
export function createObject(pack: TreePack.ITreePack): object {
    const obj: any = {};
    obj.scheme = TreeScheme.Serializer.createObject(pack.scheme);
    obj.tree = Tree.Serializer.createObject(pack.tree);
    return obj;
}
