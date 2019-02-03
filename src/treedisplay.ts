import * as Tree from "./tree";
import * as TreeView from "./treeview";
import * as Utils from "./utils";
import * as Vec from "./vector";
import * as Display from "./display";

/**
 * Draw the given tree.
 * @param root Root node for the tree to draw.
 */
export function setTree(root: Tree.Node): void {
    Display.clear();
    const positionTree = TreeView.createPositionTree(root);
    positionTree.nodes.forEach(n => createDisplay(n, positionTree));
}

/** Focus the given tree on the display. */
export function focusTree(): void {
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
    if (field === undefined)
        return 0;

    const fieldSize = { x: positionTree.getSize(node).x, y: TreeView.getFieldHeight(field) };
    const centeredYOffset = yOffset + Utils.half(nodeFieldHeight);
    const centerX = Utils.half(fieldSize.x);

    parent.addRect(`${field.kind}ValueBackground`, fieldSize, { x: 0, y: yOffset });
    parent.addText("nodeFieldName", `${field.name}:`, { x: 10, y: centeredYOffset });

    // Value
    switch (field.kind) {
        case "stringArray":
        case "numberArray":
        case "booleanArray":
        case "nodeArray":
            createArrayFieldValue(field);
            break;
        default:
            createNonArrayFieldValue(field);
            break;
    }
    return fieldSize.y;

    function createNonArrayFieldValue<T extends Tree.NonArrayField>(field: T): void {
        createElementValue(field.value, 0, 0);
    }

    function createArrayFieldValue<T extends Tree.ArrayField>(field: T): void {
        for (let i = 0; i < field.value.length; i++) {
            const element = field.value[i];
            const yOffset = i * nodeFieldHeight;
            parent.addText("arrayFieldIndexPrefix", `[${i}]`, { x: centerX, y: centeredYOffset + yOffset });
            createElementValue(element, 25, yOffset);
        }
    }

    function createElementValue<T extends Tree.FieldElement>(element: T, xOffset: number, yOffset: number): void {
        const pos: Vec.Position = { x: centerX + xOffset, y: centeredYOffset + yOffset };
        const size: Vec.Size = { x: fieldSize.x - pos.x, y: nodeFieldHeight };
        switch (typeof element) {
            case "string": createStringValue(element, pos, size); break;
            case "number": createNumberValue(element, pos, size); break;
            case "boolean": createBooleanValue(element, pos, size); break;
            default: createNodeValue(<Tree.Node>element, pos, size); break;
        }
    }

    function createStringValue(value: string, pos: Vec.Position, size: Vec.Size) {
        parent.addText("stringFieldValue", `"${value}"`, pos);
    }

    function createNumberValue(value: number, pos: Vec.Position, size: Vec.Size) {
        parent.addText("numberFieldValue", `${value}`, pos);
    }

    function createBooleanValue(value: boolean, pos: Vec.Position, size: Vec.Size) {
        parent.addText("booleanFieldValue", `${value ? "true" : "false"}`, pos);
    }

    function createNodeValue(value: Tree.Node, pos: Vec.Position, size: Vec.Size) {
        addConnection(parent, { x: fieldSize.x - 12, y: pos.y }, getRelativeVector(node, value, positionTree));
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
