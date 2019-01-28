import * as Tree from "./tree";
import * as TreeView from "./treeview";
import * as Utils from "./utils";
import * as Vec from "./vector";
import * as Display from "./display";

export function setTree(root: Tree.Node): void {
    Display.clear();
    const positionTree = TreeView.createPositionTree(root);
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
    const size = positionTree.getSize(node);
    const nodeElement = Display.createElement("node", positionTree.getPosition(node));

    nodeElement.addRect("nodeBackground", size, Vec.zeroVector);
    nodeElement.addText("nodeTypeText", node.type, { x: Utils.half(size.x), y: halfNodeHeightHeight });

    let yOffset = nodeHeaderHeight;
    node.fieldNames.forEach(fieldName => {
        yOffset += createField(node, fieldName, nodeElement, positionTree, yOffset);
    });
}

function createField(
    node: Tree.Node,
    fieldName: string,
    parent: Display.Element,
    positionTree: TreeView.PositionTree,
    yOffset: number): number {

    const field = node.getField(fieldName);
    if (field == undefined)
        return 0;

    const fieldSize = { x: positionTree.getSize(node).x, y: TreeView.getFieldHeight(field) };
    const centeredYOffset = yOffset + Utils.half(nodeFieldHeight);
    const centerX = Utils.half(fieldSize.x);

    parent.addRect(`${field.kind}ValueBackground`, fieldSize, { x: 0, y: yOffset });
    parent.addText("nodeFieldName", `${field.name}:`, { x: 10, y: centeredYOffset });

    // Value
    switch (field.kind) {
        case "string": createStringValue("", field.value, centeredYOffset); break;
        case "number": createNumberValue("", field.value, centeredYOffset); break;
        case "boolean": createBooleanValue("", field.value, centeredYOffset); break;
        case "node": createNodeValue("", field.value, centeredYOffset); break;
        case "stringArray":
            field.value.forEach((element, index) => {
                createStringValue(`[${index}] `, element, centeredYOffset + index * nodeFieldHeight);
            }); break;
        case "numberArray":
            field.value.forEach((element, index) => {
                createNumberValue(`[${index}] `, element, centeredYOffset + index * nodeFieldHeight);
            }); break;
        case "booleanArray":
            field.value.forEach((element, index) => {
                createBooleanValue(`[${index}] `, element, centeredYOffset + index * nodeFieldHeight);
            }); break;
        case "nodeArray":
            field.value.forEach((element, index) => {
                createNodeValue(`[${index}] `, element, centeredYOffset + index * nodeFieldHeight);
            }); break;
        default: Utils.assertNever(field);
    }
    return fieldSize.y;

    function createStringValue(prefix: string, value: string, fieldY: number) {
        parent.addText("stringFieldValue", `${prefix}"${value}"`, { x: centerX, y: fieldY });
    }

    function createNumberValue(prefix: string, value: number, fieldY: number) {
        parent.addText("numberFieldValue", `${prefix}${value}`, { x: centerX, y: fieldY });
    }

    function createBooleanValue(prefix: string, value: boolean, fieldY: number) {
        parent.addText("booleanFieldValue", `${prefix}${value ? "true" : "false"}`, { x: centerX, y: fieldY });
    }

    function createNodeValue(prefix: string, value: Tree.Node, fieldY: number) {
        addConnection(parent, { x: fieldSize.x - 12, y: fieldY }, getRelativeVector(node, value, positionTree));
    }
}

function addConnection(parent: Display.Element, from: Vec.Position, to: Vec.Position): void {
    parent.addCircle("nodeOutput", nodeConnectionSlotRadius, from);

    const target = Vec.add(to, nodeInputSlotOffset);
    const c1 = { x: Utils.lerp(from.x, target.x, nodeConnectionCurviness), y: from.y };
    const c2 = { x: Utils.lerp(target.x, from.x, nodeConnectionCurviness), y: target.y };
    parent.addBezier("nodeConnection", from, c1, c2, target);
}

function getRelativeVector(from: Tree.Node, to: Tree.Node, positionTree: TreeView.PositionTree): Vec.Vector2 {
    return Vec.subtract(positionTree.getPosition(to), positionTree.getPosition(from));
}
