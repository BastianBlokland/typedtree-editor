import * as Tree from "./tree";
import * as Utils from "./utils";
import * as Vec from "./vector";

export const nodeHeaderHeight = 25;
export const nodeWidth = 300;
export const nodeHorizontalSpacing = 75;
export const nodeVerticalSpacing = 25;
export const nodeFieldHeight = 25;

export interface PositionTree {
    readonly root: Tree.Node
    readonly nodes: ReadonlyArray<Tree.Node>
    readonly totalArea: Vec.Size

    getSize(node: Tree.Node): Vec.Size
    getArea(node: Tree.Node): Vec.Size
    getPosition(node: Tree.Node): Vec.Position
}

export function createPositionTree(root: Tree.Node): PositionTree {
    return new PositionTreeImpl(root);
}

export function getNodeHeight(node: Tree.Node): number {
    return nodeHeaderHeight + node.fields.map(getFieldHeight).reduce(Utils.add, 0);
}

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
        let lookup = this._sizes.get(node);
        if (lookup == undefined)
            throw new Error("Node is not known to this view-tree");
        return lookup;
    }

    getArea(node: Tree.Node): Vec.Size {
        let lookup = this._areas.get(node);
        if (lookup == undefined)
            throw new Error("Node is not known to this view-tree");
        return lookup;
    }

    getPosition(node: Tree.Node): Vec.Position {
        let lookup = this._positions.get(node);
        if (lookup == undefined)
            throw new Error("Node is not known to this view-tree");
        return lookup;
    }

    private addSizes(node: Tree.Node): void {
        let size = { x: nodeWidth, y: getNodeHeight(node) };
        this._sizes.set(node, size);
        Tree.forEachDirectChild(node, child => this.addSizes(child));
    }

    private addAreas(node: Tree.Node): Vec.Size {
        let size = this.getSize(node);

        let directChildren = Tree.getDirectChildren(node);
        if (directChildren.length == 0) {
            this._areas.set(node, size);
            return size;
        }

        let childTotalHeight = (directChildren.length - 1) * nodeVerticalSpacing;
        let childMaxWidth = nodeHorizontalSpacing;
        directChildren.forEach(child => {
            let childSize = this.addAreas(child);
            childTotalHeight += childSize.y;
            childMaxWidth = Math.max(childMaxWidth, childSize.x);
        });

        let area = { x: size.x + childMaxWidth, y: Math.max(size.y, childTotalHeight) };
        this._areas.set(node, area);
        return area;
    }

    private addPositions(node: Tree.Node, referencePos: Vec.Position): void {
        let size = this.getSize(node);
        let area = this.getArea(node);
        let position = { x: referencePos.x, y: referencePos.y + Utils.half(area.y) - Utils.half(size.y) };
        this._positions.set(node, position);

        let childX = referencePos.x + size.x + nodeHorizontalSpacing;
        let childY = referencePos.y;
        Tree.forEachDirectChild(node, child => {
            this.addPositions(child, { x: childX, y: childY });
            childY += this.getArea(child).y + nodeVerticalSpacing;
        });
    }
}
