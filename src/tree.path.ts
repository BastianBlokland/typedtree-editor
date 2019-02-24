/**
 * @file Responsible for searching tree structures. Can be used to find a path between two related
 * nodes.
 */

import * as Tree from "./tree";

/** Represents an output in the tree (node + field combination). */
export interface IParent {
    readonly node: Tree.INode;
    readonly output: Tree.IFieldElementIdentifier;
}

/**
 * Walk the tree to find a path to the root from any given node in the tree.
 * Will throw if 'target' is not a (grand)child of 'root'.
 * Note: Potentially requires walking the entire tree starting from 'root'.
 * @param root Root to start walking from.
 * @param target Target to walk to.
 * @returns Path from the target to the root.
 */
export function findPathToRoot(root: Tree.INode, target: Tree.INode): IParent[] {
    const resultPath: IParent[] = [];
    if (findLeaf(root, target, resultPath)) {
        return resultPath;
    }
    throw new Error("'target' is not a (grand)child of 'root'");

    function findLeaf(node: Tree.INode, target: Tree.INode, path: IParent[]): boolean {
        if (node === target) {
            return true;
        }

        let found = false;
        Tree.forEachDirectChild(node, (child, output) => {

            // If this child leads to the target then add this output to the path and return.
            if (findLeaf(child, target, path)) {
                path.push({ node, output });
                found = true;
                return false; // Short-circuit the foreach.
            }

            // Otherwise keep checking the next children.
            return true;
        });
        return found;
    }
}

/**
 * Find the parent of a node given a root.
 * Will throw if 'target' is not a (grand)child of 'root'.
 * Note: Potentially requires walking the entire tree starting from 'root'.
 * @param root Root to start checking from.
 * @param node Node to find the parent for.
 * @returns Parent if one is found or undefined if no parent is found.
 */
export function getParent(root: Tree.INode, node: Tree.INode): IParent | undefined {
    const pathToRoot = findPathToRoot(root, node);
    if (pathToRoot.length === 0) {
        return undefined;
    }
    return pathToRoot[0];
}
