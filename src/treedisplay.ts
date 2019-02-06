import * as Tree from "./tree";
import * as TreeModifications from "./treemodifications";
import * as TreeView from "./treeview";
import * as Utils from "./utils";
import * as Vec from "./vector";
import * as Display from "./display";

export type treeChangedCallback = (newTree: Tree.Node) => void;

/**
 * Draw the given tree.
 * @param root Root node for the tree to draw.
 */
export function setTree(root: Tree.Node, changed: treeChangedCallback | undefined = undefined): void {
    Display.clear();
    const positionTree = TreeView.createPositionTree(root);
    positionTree.nodes.forEach(node => {
        createNode(node, positionTree, newNode => {
            if (changed !== undefined) {
                changed(TreeModifications.treeWithReplacedNode(root, node, newNode));
            }
        });
    });
}

/** Focus the given tree on the display. */
export function focusTree(): void {
    Display.focusContent();
}

const nodeHeaderHeight = TreeView.nodeHeaderHeight;
const halfNodeHeightHeight = Utils.half(nodeHeaderHeight);
const nodeFieldHeight = TreeView.nodeFieldHeight;
const nodeInputSlotOffset: Vec.Vector2 = { x: 0, y: 12.5 };
const nodeConnectionCurviness = .7;

type nodeChangedCallback = (newNode: Tree.Node) => void;

function createNode(
    node: Tree.Node,
    positionTree: TreeView.PositionTree,
    changed: nodeChangedCallback): void {

    const size = positionTree.getSize(node);
    const nodeElement = Display.createElement("node", positionTree.getPosition(node));

    nodeElement.addRect("nodeBackground", size, Vec.zeroVector);
    nodeElement.addText("nodeTypeText", node.type, { x: Utils.half(size.x), y: halfNodeHeightHeight });

    let yOffset = nodeHeaderHeight;
    node.fieldNames.forEach(fieldName => {
        yOffset += createField(node, fieldName, nodeElement, positionTree, yOffset, newField => {
            changed(TreeModifications.nodeWithField(node, newField));
        });
    });
}

type fieldChangedCallback<T extends Tree.Field> = (newField: T) => void;

function createField(
    node: Tree.Node,
    fieldName: string,
    parent: Display.Element,
    positionTree: TreeView.PositionTree,
    yOffset: number,
    changed: fieldChangedCallback<Tree.Field>): number {

    const field = node.getField(fieldName);
    if (field === undefined)
        return 0;

    const fieldSize = { x: positionTree.getSize(node).x, y: TreeView.getFieldHeight(field) };
    const centeredYOffset = yOffset + Utils.half(nodeFieldHeight);
    const nameWidth = Utils.half(fieldSize.x) - 10;

    parent.addRect(`${field.kind}ValueBackground`, fieldSize, { x: 0, y: yOffset });
    parent.addText("nodeFieldName", `${field.name}:`, { x: 10, y: centeredYOffset });

    // Value
    switch (field.kind) {
        case "stringArray":
        case "numberArray":
        case "booleanArray":
        case "nodeArray":
            createArrayFieldValue(field, changed);
            break;
        default:
            createNonArrayFieldValue(field, changed);
            break;
    }
    return fieldSize.y;

    function createNonArrayFieldValue<T extends Tree.NonArrayField>(
        field: T,
        changed: fieldChangedCallback<T>): void {

        createElementValue(field.value, 0, 0, newElement => {
            changed(TreeModifications.fieldWithValue(field, <Tree.FieldValueType<T>>newElement));
        });
    }

    function createArrayFieldValue<T extends Tree.ArrayField>(
        field: T,
        changed: fieldChangedCallback<T>): void {

        for (let i = 0; i < field.value.length; i++) {
            const element = field.value[i];
            const yOffset = i * nodeFieldHeight;
            parent.addText("arrayFieldIndexPrefix", `[${i}]`, { x: nameWidth, y: centeredYOffset + yOffset });
            createElementValue(element, 20, yOffset, newElement => {
                changed(TreeModifications.fieldWithElement(field, <Tree.FieldElementType<T>>newElement, i));
            });
        }
    }

    type elementChangedCallback<T extends Tree.FieldElement> = (newText: T) => void;

    function createElementValue<T extends Tree.FieldElement>(
        element: T,
        xOffset: number,
        yOffset: number,
        changed: elementChangedCallback<T>): void {

        const pos: Vec.Position = { x: nameWidth + xOffset, y: centeredYOffset + yOffset };
        const size: Vec.Size = { x: fieldSize.x - pos.x, y: nodeFieldHeight };
        switch (typeof element) {
            case "string": createStringValue(element, pos, size, <elementChangedCallback<string>>changed); break;
            case "number": createNumberValue(element, pos, size, <elementChangedCallback<number>>changed); break;
            case "boolean": createBooleanValue(element, pos, size, <elementChangedCallback<boolean>>changed); break;
            default: createNodeValue(<Tree.Node>element, pos, size); break;
        }
    }

    function createStringValue(
        value: string,
        pos: Vec.Position,
        size: Vec.Size,
        changed: elementChangedCallback<string>): void {

        parent.addEditableText("stringFieldValue", value, pos, size, changed);
    }

    function createNumberValue(
        value: number,
        pos: Vec.Position,
        size: Vec.Size,
        changed: elementChangedCallback<number>): void {

        parent.addEditableNumber("numberFieldValue", value, pos, size, changed);
    }

    function createBooleanValue(
        value: boolean,
        pos: Vec.Position,
        size: Vec.Size,
        changed: elementChangedCallback<boolean>): void {

        parent.addEditableBoolean("booleanFieldValue", value, pos, size, changed);
    }

    function createNodeValue(
        value: Tree.Node,
        pos: Vec.Position,
        size: Vec.Size): void {

        addConnection(parent, { x: fieldSize.x - 12, y: pos.y }, getRelativeVector(node, value, positionTree));
    }
}

function addConnection(parent: Display.Element, from: Vec.Position, to: Vec.Position): void {
    parent.addGraphics("nodeOutput", "nodeConnector", from);

    const target = Vec.add(to, nodeInputSlotOffset);
    const c1 = { x: Utils.lerp(from.x, target.x, nodeConnectionCurviness), y: from.y };
    const c2 = { x: Utils.lerp(target.x, from.x, nodeConnectionCurviness), y: target.y };
    parent.addBezier("nodeConnection", from, c1, c2, target);
}

function getRelativeVector(from: Tree.Node, to: Tree.Node, positionTree: TreeView.PositionTree): Vec.Vector2 {
    return Vec.subtract(positionTree.getPosition(to), positionTree.getPosition(from));
}
