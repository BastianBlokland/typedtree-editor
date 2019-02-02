import * as Tree from "./tree";
import * as Utils from "./utils";
import * as Vec from "./vector";

/** Height for the header (the part that contains the type) of a node. */
export const nodeHeaderHeight = 25;

/** Width of a node. */
export const nodeWidth = 300;

/** Horizontal spaces between nodes. */
export const nodeHorizontalSpacing = 100;

/** Vertical spacing between nodes. */
export const nodeVerticalSpacing = 25;

/** Height of a single field element on a node. (Arrays multiply this by the array length) */
export const nodeFieldHeight = 25;

/** Immutable object that can be used to find where nodes should be positioned. */
export interface PositionTree {
    /** Root node for this tree. */
    readonly root: Tree.Node
    /** All the nodes in the tree. */
    readonly nodes: ReadonlyArray<Tree.Node>
    /** Total area taken up by this tree. */
    readonly totalArea: Vec.Size

    /**
     * Get the size of the given node.
     * @param node Node to get the size for.
     * @returns Vector representing the size of given node.
     */
    getSize(node: Tree.Node): Vec.Size

    /**
     * Get the area taken up by the given node and its children.
     * @param node Node to get the area for.
     * @returns Vector representing the area taken up by the node and its children.
     */
    getArea(node: Tree.Node): Vec.Size

    /**
     * Get the position of the given node.
     * @param node To get the position for.
     * @returns Vector representing the position of the given node.
     */
    getPosition(node: Tree.Node): Vec.Position
}

/**
 * Create a position-tree object for the given node (and its children).
 * @param root Root node for the tree to make a position-tree for.
 * @returns Position-tree object for the given root.
 */
export function createPositionTree(root: Tree.Node): PositionTree {
    return new PositionTreeImpl(root);
}

/**
 * Get the height of the given node.
 * @param node Node to get the height for.
 * @returns Number representing the height of the given node.
 */
export function getNodeHeight(node: Tree.Node): number {
    return nodeHeaderHeight + node.fields.map(getFieldHeight).reduce(Utils.add, 0);
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
            return nodeFieldHeight * field.value.length;
        default:
            Utils.assertNever(field);
            return 0;
    }
}

class PositionTreeImpl implements PositionTree {
    private readonly _root: Tree.Node;
    private readonly _totalArea: Vec.Size;
    private readonly _nodes: Tree.Node[] = []
    private readonly _sizes: Map<Tree.Node, Vec.Size> = new Map();
    private readonly _areas: Map<Tree.Node, Vec.Size> = new Map();
    private readonly _positions: Map<Tree.Node, Vec.Position> = new Map();

    constructor(root: Tree.Node) {
        this._root = root;
        this._nodes = Tree.getAllChildren(root);
        this._nodes.unshift(root); // Add 'root' as the first node

        this.addSizes(root);
        this._totalArea = this.addAreas(root);
        this.addPositions(root, { x: 0, y: 0 });
    }

    get root(): Tree.Node {
        return this._root;
    }

    get nodes(): ReadonlyArray<Tree.Node> {
        return this._nodes;
    }

    get totalArea(): Vec.Size {
        return this._totalArea;
    }

    getSize(node: Tree.Node): Vec.Size {
        const lookup = this._sizes.get(node);
        if (lookup === undefined)
            throw new Error("Node is not known to this view-tree");
        return lookup;
    }

    getArea(node: Tree.Node): Vec.Size {
        const lookup = this._areas.get(node);
        if (lookup === undefined)
            throw new Error("Node is not known to this view-tree");
        return lookup;
    }

    getPosition(node: Tree.Node): Vec.Position {
        const lookup = this._positions.get(node);
        if (lookup === undefined)
            throw new Error("Node is not known to this view-tree");
        return lookup;
    }

    private addSizes(node: Tree.Node): void {
        const size = { x: nodeWidth, y: getNodeHeight(node) };
        this._sizes.set(node, size);
        Tree.forEachDirectChild(node, child => this.addSizes(child));
    }

    private addAreas(node: Tree.Node): Vec.Size {
        const size = this.getSize(node);

        const directChildren = Tree.getDirectChildren(node);
        if (directChildren.length === 0) {
            this._areas.set(node, size);
            return size;
        }

        let childTotalHeight = (directChildren.length - 1) * nodeVerticalSpacing;
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

    private addPositions(node: Tree.Node, referencePos: Vec.Position): void {
        const size = this.getSize(node);
        const area = this.getArea(node);
        const position = { x: referencePos.x, y: referencePos.y + Utils.half(area.y) - Utils.half(size.y) };
        this._positions.set(node, position);

        const childX = referencePos.x + size.x + nodeHorizontalSpacing;
        let childY = referencePos.y;
        Tree.forEachDirectChild(node, child => {
            this.addPositions(child, { x: childX, y: childY });
            childY += this.getArea(child).y + nodeVerticalSpacing;
        });
    }
}
