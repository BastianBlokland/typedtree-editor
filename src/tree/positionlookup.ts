/**
 * @file Responsible for converting a tree model into a 2d structure that can be used to display tree's.
 * Example usage:
 * - Create a 'PositionLookup' for a given tree structure.
 * - Display the nodes using the positions and sizes from the 'PositionLookup'
 */

import * as Utils from "../utils";
import { Vector } from "../utils";
import * as Tree from "./tree";

/** Height of the name area of a node. */
export const nodeNameHeight = 25;

/** Height for the header (the part that contains the type) of a node. */
export const nodeHeaderHeight = 25;

/** Width of a node. */
export const nodeWidth = 400;

/** Horizontal spaces between nodes. */
export const nodeHorizontalSpacing = 150;

/** Vertical spacing between nodes. */
export const nodeVerticalSpacing = 25;

/**
 * Apply extra vertical spacing the deeper in the tree we go, this visually separates the different
 * branches.
 */
export const nodeExtraVerticalSpacingPerTier = 50;

/** Height of a single field element on a node. (Arrays multiply this by the array length) */
export const nodeFieldHeight = 25;

/** Immutable object that can be used to find where nodes should be positioned. */
export interface IPositionLookup {
    /** Root node for this tree. */
    readonly root: Tree.INode;
    /** All the nodes in the tree. */
    readonly nodes: ReadonlyArray<Tree.INode>;
    /** Total area taken up by this tree. */
    readonly totalArea: Vector.Size;
    /** Offset of the root node, can be used to center something on the tree for example */
    readonly rootOffset: Vector.Size;

    /**
     * Get the size of the given node.
     * @param node Node to get the size for.
     * @returns Vector representing the size of given node.
     */
    getSize(node: Tree.INode): Vector.Size;

    /**
     * Get the area taken up by the given node and its children.
     * @param node Node to get the area for.
     * @returns Vector representing the area taken up by the node and its children.
     */
    getArea(node: Tree.INode): Vector.Size;

    /**
     * Get the position of the given node.
     * @param node To get the position for.
     * @returns Vector representing the position of the given node.
     */
    getPosition(node: Tree.INode): Vector.Position;
}

/**
 * Create a positionlookup object for the given node (and its children).
 * @param root Root node for the tree to make a positionlookup for.
 * @returns PositionLookup object for the given root.
 */
export function createPositionLookup(root: Tree.INode): IPositionLookup {
    return new PositionLookupImpl(root);
}

/**
 * Get the height of the given node.
 * @param node Node to get the height for.
 * @returns Number representing the height of the given node.
 */
export function getNodeHeight(node: Tree.INode): number {
    let height = 0;
    height += node.name !== undefined ? nodeNameHeight : 0;
    height += nodeHeaderHeight;
    height += node.fields.map(getFieldHeight).reduce(Utils.add, 0);
    return height;
}

/**
 * Get the height of the given field.
 * @param field Field to get the height for.
 * @returns Number representing the height of the given field.
 */
export function getFieldHeight(field: Tree.Field): number {
    switch (field.kind) {
        case "string":
        case "number":
        case "boolean":
        case "node":
            return nodeFieldHeight;
        case "stringArray":
        case "numberArray":
        case "booleanArray":
        case "nodeArray":
            return nodeFieldHeight * Math.max(1, field.value.length);
        default:
            Utils.assertNever(field);
            return 0;
    }
}

class PositionLookupImpl implements IPositionLookup {
    private readonly _root: Tree.INode;
    private readonly _totalArea: Vector.Size;
    private readonly _nodes: Tree.INode[] = [];
    private readonly _sizes: Map<Tree.INode, Vector.Size> = new Map();
    private readonly _areas: Map<Tree.INode, Vector.Size> = new Map();
    private readonly _positions: Map<Tree.INode, Vector.Position> = new Map();

    constructor(root: Tree.INode) {
        this._root = root;
        this._nodes = Tree.getAllChildren(root);
        this._nodes.unshift(root); // Add 'root' as the first node

        this.addSizes(root);
        this._totalArea = this.addAreas(root);
        this.addPositions(root, this.rootOffset);
    }

    get root(): Tree.INode {
        return this._root;
    }

    get nodes(): ReadonlyArray<Tree.INode> {
        return this._nodes;
    }

    get totalArea(): Vector.Size {
        return this._totalArea;
    }

    get rootOffset(): Vector.Position {
        const rootArea = this.getArea(this._root);
        return { x: 0, y: -Utils.half(rootArea.y) };
    }

    public getSize(node: Tree.INode): Vector.Size {
        const lookup = this._sizes.get(node);
        if (lookup === undefined) {
            throw new Error("Node is not known to this positionlookup");
        }
        return lookup;
    }

    public getArea(node: Tree.INode): Vector.Size {
        const lookup = this._areas.get(node);
        if (lookup === undefined) {
            throw new Error("Node is not known to this positionlookup");
        }
        return lookup;
    }

    public getPosition(node: Tree.INode): Vector.Position {
        const lookup = this._positions.get(node);
        if (lookup === undefined) {
            throw new Error("Node is not known to this positionlookup");
        }
        return lookup;
    }

    private addSizes(node: Tree.INode): void {
        const size = { x: nodeWidth, y: getNodeHeight(node) };
        this._sizes.set(node, size);
        Tree.forEachDirectChild(node, child => this.addSizes(child));
    }

    private addAreas(node: Tree.INode): Vector.Size {
        const size = this.getSize(node);

        const directChildren = Tree.getDirectChildren(node);
        if (directChildren.length === 0) {
            this._areas.set(node, size);
            return size;
        }

        let childTotalHeight = (directChildren.length - 1) * nodeVerticalSpacing;
        if (node !== this._root) {
            childTotalHeight += nodeExtraVerticalSpacingPerTier;
        }

        let childMaxWidth = nodeHorizontalSpacing;
        directChildren.forEach(child => {
            const childSize = this.addAreas(child);
            childTotalHeight += childSize.y;
            childMaxWidth = Math.max(childMaxWidth, childSize.x);
        });

        const area = { x: size.x + childMaxWidth, y: Math.max(size.y, childTotalHeight) };
        this._areas.set(node, area);
        return area;
    }

    private addPositions(node: Tree.INode, referencePos: Vector.Position): void {
        const size = this.getSize(node);
        const area = this.getArea(node);
        const position = { x: referencePos.x, y: referencePos.y + Utils.half(area.y) - Utils.half(size.y) };
        this._positions.set(node, position);

        const childX = referencePos.x + size.x + nodeHorizontalSpacing;
        let childY = referencePos.y;
        if (node !== this._root) {
            childY += Utils.half(nodeExtraVerticalSpacingPerTier);
        }

        Tree.forEachDirectChild(node, child => {
            this.addPositions(child, { x: childX, y: childY });
            childY += this.getArea(child).y + nodeVerticalSpacing;
        });
    }
}
