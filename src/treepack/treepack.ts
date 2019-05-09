/**
 * @file Immutable data-model for representing a scheme and a tree.
 */

import * as Tree from "../tree";
import * as TreeScheme from "../treescheme";

/** Immutable structure combining a scheme and a tree */
export interface ITreePack {
    readonly scheme: TreeScheme.IScheme;
    readonly tree: Tree.INode;
}

/**
 * Construct a pack, combining a scheme and a tree.
 * @param scheme Scheme to add to the pack.
 * @param tree Tree to add to the pack.
 * @returns Newly constructed (immutable) node
 */
export function createPack(scheme: TreeScheme.IScheme, tree: Tree.INode): ITreePack {
    return new TreePackImpl(scheme, tree);
}

class TreePackImpl implements ITreePack {
    private readonly _scheme: TreeScheme.IScheme;
    private readonly _tree: Tree.INode;

    constructor(scheme: TreeScheme.IScheme, tree: Tree.INode) {
        const validateResult = TreeScheme.Validator.validate(scheme, tree);
        if (validateResult !== true) {
            throw new Error(
                `Given tree is not compatible with given scheme: ${validateResult.errorMessage}`);
        }

        this._scheme = scheme;
        this._tree = tree;
    }

    get scheme(): TreeScheme.IScheme {
        return this._scheme;
    }

    get tree(): Tree.INode {
        return this._tree;
    }
}
