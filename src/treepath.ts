import * as Tree from "./tree";

/** Represents an output in the tree (node + field combination). */
export interface Parent {
    readonly node: Tree.Node
    readonly output: Tree.FieldElementIdentifier
}

/**
 * Walk the tree to find a path to the root from any given node in the tree.
 * Will throw if 'target' is not a (grand)child of 'root'.
 * Note: Potentially requires walking the entire tree starting from 'root'.
 * @param root Root to start walking from.
 * @param target Target to walk to.
 * @returns Path from the target to the root.
 */
export function findPathToRoot(root: Tree.Node, target: Tree.Node): Parent[] {
    let resultPath: Parent[] = [];
    if (findLeaf(root, target, resultPath))
        return resultPath;
    throw new Error("'target' is not a (grand)child of 'root'");

    function findLeaf(node: Tree.Node, target: Tree.Node, path: Parent[]): boolean {
        if (node === target)
            return true;

        let found = false;
        Tree.forEachDirectChild(node, (child, output) => {

            // If this child leads to the target then add this output to the path and return.
            if (findLeaf(child, target, path)) {
                path.push({ node: node, output: output });
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
export function getParent(root: Tree.Node, node: Tree.Node): Parent | undefined {
    const pathToRoot = findPathToRoot(root, node);
    if (pathToRoot.length === 0)
        return undefined;
    return pathToRoot[0];
}
