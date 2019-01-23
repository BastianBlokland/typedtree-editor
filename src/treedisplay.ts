import * as Tree from "./tree";
import * as TreeView from "./treeview";
import * as Utils from "./utils";
import * as Vec from "./vector";
import * as Display from "./display";

export function initialize(): void {
    Display.initialize();
}

export function setTree(root: Tree.Node): void {
    Display.clear();
    let positionTree = TreeView.createPositionTree(root);
    positionTree.nodes.forEach(n => createDisplay(n, positionTree));
    Display.focusContent();
}

const nodeHeaderHeight = TreeView.nodeHeaderHeight;
const halfNodeHeightHeight = Utils.half(nodeHeaderHeight);
const nodeFieldHeight = TreeView.nodeFieldHeight;
const nodeInputSlotOffset: Vec.Vector2 = { x: 0, y: 12.5 };
const nodeConnectionSlotRadius = 15;
const nodeConnectionCurviness = .7;

function createDisplay(node: Tree.Node, positionTree: TreeView.PositionTree): void {
    let pos = positionTree.getPosition(node);
    let size = positionTree.getSize(node);

    let nodeElement = Display.createElement("node", pos);
    nodeElement.addRect("nodeBackground", size, Vec.zeroVector);
    nodeElement.addText("nodeTypeText", node.type, { x: Utils.half(size.x), y: halfNodeHeightHeight });

    let yOffset = nodeHeaderHeight;
    node.fields.forEach(field => {
        let fieldHeight = TreeView.getFieldHeight(field);
        let centeredYOffset = yOffset + Utils.half(nodeFieldHeight);
        nodeElement.addRect("nodeFieldBackground", { x: size.x, y: fieldHeight }, { x: 0, y: yOffset });
        nodeElement.addText("nodeFieldName", field.name, { x: 10, y: centeredYOffset });

        switch (field.value.kind) {
            case "node":
                addConnection(nodeElement, { x: size.x - 12, y: centeredYOffset }, getRelativeVector(node, field.value.node, positionTree));
                break;
            case "nodeArray":
                field.value.array.forEach((arrayNode, index) => {
                    let y = centeredYOffset + index * nodeFieldHeight;
                    addConnection(nodeElement, { x: size.x - 12, y: y }, getRelativeVector(node, arrayNode, positionTree));
                });
                break;
            default: Utils.assertNever(field.value);
        }

        yOffset += fieldHeight;
    });
}

function addConnection(element: Display.Element, from: Vec.Position, to: Vec.Position): void {
    element.addCircle("nodeOutput", nodeConnectionSlotRadius, from);

    let target = Vec.add(to, nodeInputSlotOffset);
    let c1 = { x: Utils.lerp(from.x, target.x, nodeConnectionCurviness), y: from.y };
    let c2 = { x: Utils.lerp(target.x, from.x, nodeConnectionCurviness), y: target.y };
    element.addBezier("nodeConnection", from, c1, c2, target);
}

function getRelativeVector(from: Tree.Node, to: Tree.Node, positionTree: TreeView.PositionTree): Vec.Vector2 {
    return Vec.subtract(positionTree.getPosition(to), positionTree.getPosition(from));
}
