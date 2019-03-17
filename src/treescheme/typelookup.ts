/**
 * @file Can be used to gather type-info from nodes in a tree without having to
 * recurse the structure.
 * Example usage:
 * - Create a 'TypeLookup' for a given tree structure and scheme.
 * - Gather type info for nodes from the 'TypeLookup'
 */

import * as Tree from "../tree";
import * as TreeScheme from "./treescheme";

/** Immutable object that can be used to find type-info for nodes in a tree. */
export interface ITypeLookup {
    /** Scheme used in this lookup. */
    readonly scheme: TreeScheme.IScheme;

    /** Root node for this tree. */
    readonly root: Tree.INode;

    /**
     * Get the alias that this node is part of. Can be useful to determine with what other node-types
     * this node can be exchanged.
     * @param node Node to get the alias for.
     * @returns Alias that this node is part of.
     */
    getAlias(node: Tree.INode): TreeScheme.IAlias;

    /**
     * Get the type definition for this node.
     * @param node Node to get the definition for.
     * @returns Node definition that belongs to this node.
     */
    getDefinition(node: Tree.INode): TreeScheme.INodeDefinition;
}

/**
 * Create a typelookup object for the given node (and its children).
 * @param scheme Scheme to use for the type lookups.
 * @param root Root node for the tree to the make a typelookup for.
 * @returns TypeLookup object for the given root and scheme.
 */
export function createTypeLookup(scheme: TreeScheme.IScheme, root: Tree.INode): ITypeLookup {
    return new TypeLookupImpl(scheme, root);
}

class TypeLookupImpl implements ITypeLookup {
    private readonly _scheme: TreeScheme.IScheme;
    private readonly _root: Tree.INode;
    private readonly _aliases: Map<Tree.INode, TreeScheme.IAlias> = new Map();
    private readonly _definitions: Map<Tree.INode, TreeScheme.INodeDefinition> = new Map();

    constructor(scheme: TreeScheme.IScheme, root: Tree.INode) {
        this._scheme = scheme;
        this._root = root;

        // Set the alias for the root
        this._aliases.set(root, scheme.rootAlias);
        // Set aliases for the other nodes
        this.setAliases(root);

        // Set definitions for all nodes
        this.setDefinitions(root);
    }

    get scheme(): TreeScheme.IScheme {
        return this._scheme;
    }

    get root(): Tree.INode {
        return this._root;
    }

    public getAlias(node: Tree.INode): TreeScheme.IAlias {
        const lookup = this._aliases.get(node);
        if (lookup === undefined) {
            throw new Error("Node is not known to this typelookup");
        }
        return lookup;
    }

    public getDefinition(node: Tree.INode): TreeScheme.INodeDefinition {
        const lookup = this._definitions.get(node);
        if (lookup === undefined) {
            throw new Error("Node is not known to this typelookup");
        }
        return lookup;
    }

    private setAliases(node: Tree.INode): void {
        const definition = this._scheme.getNode(node.type);
        if (definition === undefined) {
            return;
        }
        node.fields.forEach(field => {
            const fieldDefinition = definition.getField(field.name);
            if (fieldDefinition === undefined) {
                return;
            }
            const alias = TreeScheme.validateAliasType(fieldDefinition.valueType);
            if (alias === undefined) {
                return;
            }
            switch (field.kind) {
                case "node":
                    this._aliases.set(field.value, alias);
                    this.setAliases(field.value);
                    break;
                case "nodeArray":
                    field.value.forEach(child => {
                        this._aliases.set(child, alias);
                        this.setAliases(child);
                    });
                    break;
            }
        });
    }

    private setDefinitions(node: Tree.INode): void {
        const definition = this._scheme.getNode(node.type);
        if (definition !== undefined) {
            this._definitions.set(node, definition);
        }
        Tree.forEachDirectChild(node, child => this.setDefinitions(child));
    }
}
