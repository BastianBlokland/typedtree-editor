/**
 * @file Responsible for instantiating tree nodes from a scheme.
 */

import * as Tree from "./tree";
import * as TreeScheme from "./treescheme";

/**
 * Instantiate a node from a node-definition.
 * @param scheme Scheme that the node-definition is part of.
 * @param node Definition of the node to instantiate.
 * @returns Newly created node.
 */
export function instantiate(scheme: TreeScheme.IScheme, node: TreeScheme.INodeDefinition): Tree.INode {
    throw new Error("not implemented yet");
}
