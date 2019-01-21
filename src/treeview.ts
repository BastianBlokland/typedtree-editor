import * as Tree from "./tree";
import * as Utils from "./utils";
import * as Math from "./math";
import * as Vec from "./vector";
import * as Display from "./display";

export function initialize(): void {
    Display.initialize();
}

export function setTree(root: Tree.Node): void {
    Display.clear();
    let viewTree = new ViewTree(root);
    viewTree.nodes.forEach(n => createDisplay(n, viewTree));
}

function createDisplay(node: Tree.Node, viewTree: ViewTree) {
    let pos = viewTree.getPosition(node);
    let size = viewTree.getSize(node);

    let nodeElement = Display.createElement("node", pos);
    nodeElement.addRect("nodeBackground", size, Vec.zeroVector);
    nodeElement.addText("nodeTypeText", node.type, { x: Math.half(size.x), y: 0 });
    nodeElement.addLine("nodeTypeSeparator", { x: 0, y: nodeHeaderHeight }, { x: size.x, y: nodeHeaderHeight });

    let yOffset = nodeHeaderHeight;
    node.fields.forEach(field => {
        let fieldElement = nodeElement.addElement("nodeField", { x: 0, y: yOffset });
        fieldElement.addText("nodeFieldName", field.name, { x: Math.half(nodePadding), y: 0 });
        yOffset += getFieldHeight(field);
    });
}

const nodeHeaderHeight = 20;
const nodePadding = 10;
const nodeWidth = 250;
const nodeHorizontalSpacing = 50;
const nodeVerticalSpacing = 25;
const nodeFieldHeight = 25;

class ViewTree {
    private readonly _root: Tree.Node;
    private readonly _totalArea: Vec.Size;
    private readonly _nodes: Tree.Node[] = []
    private readonly _sizes: Map<Tree.Node, Vec.Size> = new Map();
    private readonly _areas: Map<Tree.Node, Vec.Size> = new Map();
    private readonly _positions: Map<Tree.Node, Vec.Position> = new Map();

    constructor(root: Tree.Node) {
        this._root = root;
        this.addNodes(root)
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

    private addNodes(node: Tree.Node): void {
        this._nodes.push(node);
        Tree.forEachDirectChild(node, child => this.addNodes(child));
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
        let position = { x: referencePos.x, y: referencePos.y + Math.half(area.y) - Math.half(size.y) };
        this._positions.set(node, position);

        let childX = referencePos.x + size.x + nodeHorizontalSpacing;
        let childY = referencePos.y;
        Tree.forEachDirectChild(node, child => {
            this.addPositions(child, { x: childX, y: childY });
            childY += this.getArea(child).y + nodeVerticalSpacing;
        });
    }
}

function getNodeHeight(node: Tree.Node): number {
    return nodeHeaderHeight + nodePadding + node.fields.map(getFieldHeight).reduce(Math.add, 0);
}

function getFieldHeight(field: Tree.Field): number {
    switch (field.value.kind) {
        case "node":
            return nodeFieldHeight;
        case "nodeArray":
            return nodeFieldHeight * field.value.array.length;
        default:
            Utils.assertNever(field.value);
            return 0;
    }
}
