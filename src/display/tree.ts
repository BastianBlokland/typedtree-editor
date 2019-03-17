/**
 * @file Responsible for displaying tree nodes.
 */

import * as Tree from "../tree";
import * as TreeScheme from "../treescheme";
import * as Utils from "../utils";
import { Vector } from "../utils";
import * as Svg from "./svg";

/** Callback for when a tree is changed, returns a new immutable tree. */
export type treeChangedCallback = (newTree: Tree.INode) => void;

/**
 * Draw the given tree.
 * @param scheme Scheme that the given tree follows.
 * @param root Root node for the tree to draw.
 * @param changed Callback that is invoked when the user changes the tree.
 */
export function setTree(
    scheme: TreeScheme.IScheme,
    root: Tree.INode | undefined,
    changed: treeChangedCallback | undefined): void {

    if (root === undefined) {
        Svg.setContent(undefined);
        return;
    }

    const typeLookup = TreeScheme.TypeLookup.createTypeLookup(scheme, root);
    const positionLookup = Tree.PositionLookup.createPositionLookup(root);

    Svg.setContent(b => {
        positionLookup.nodes.forEach(node => {
            createNode(b, node, typeLookup, positionLookup, newNode => {
                if (changed !== undefined) {
                    changed(Tree.Modifications.treeWithReplacedNode(root, node, newNode));
                }
            });
        });
    });
    Svg.setContentOffset(positionLookup.rootOffset);
}

/** Focus the given tree on the display. */
export function focusTree(maxScale?: number): void {
    Svg.focusContent(maxScale);
}

/**
 * Zoom on the tree, use positive delta for zooming-in and negative delta for zooming-out.
 * @param delta Number indicating how far to zoom. (Use negative numbers for zooming out)
 */
export function zoom(delta: number = 0.1): void {
    Svg.zoom(delta);
}

const nodeHeaderHeight = Tree.PositionLookup.nodeHeaderHeight;
const halfNodeHeaderHeight = Utils.half(nodeHeaderHeight);
const nodeFieldHeight = Tree.PositionLookup.nodeFieldHeight;
const nodeInputSlotOffset: Vector.IVector2 = { x: 0, y: 12.5 };
const nodeConnectionCurviness = .7;

type nodeChangedCallback = (newNode: Tree.INode) => void;

function createNode(
    builder: Svg.IBuilder,
    node: Tree.INode,
    typeLookup: TreeScheme.TypeLookup.ITypeLookup,
    positionLookup: Tree.PositionLookup.IPositionLookup,
    changed: nodeChangedCallback): void {

    let definition: TreeScheme.INodeDefinition | undefined;
    if (node.type !== Tree.noneNodeType) {
        definition = typeLookup.getDefinition(node);
    }
    const typeOptions = getTypeOptions(typeLookup, node);
    const typeOptionsIndex = typeOptions.findIndex(a => a === node.type);
    const size = positionLookup.getSize(node);
    const nodeElement = builder.addElement("node", positionLookup.getPosition(node));
    const backgroundClass = node.type === Tree.noneNodeType ? "nonenode-background" : "node-background";

    nodeElement.addRect(backgroundClass, size, Vector.zeroVector);
    nodeElement.addDropdown(
        "node-type",
        typeOptionsIndex,
        typeOptions,
        /* Ugly offsets to compensate for styling of select elements */
        { x: 0, y: halfNodeHeaderHeight - 3 },
        { x: size.x, y: nodeHeaderHeight - 5 },
        newIndex => {
            const newNodeType = typeOptions[newIndex];
            const newNode = TreeScheme.Instantiator.changeNodeType(typeLookup.scheme, node, newNodeType);
            changed(newNode);
        });

    let yOffset = nodeHeaderHeight;
    node.fieldNames.forEach(fieldName => {
        yOffset += createField(node, definition, fieldName, nodeElement, positionLookup, yOffset, newField => {
            changed(Tree.Modifications.nodeWithField(node, newField));
        });
    });
}

type fieldChangedCallback<T extends Tree.Field> = (newField: T) => void;

function createField(
    node: Tree.INode,
    nodeDefinition: TreeScheme.INodeDefinition | undefined,
    fieldName: string,
    parent: Svg.IElement,
    positionLookup: Tree.PositionLookup.IPositionLookup,
    yOffset: number,
    changed: fieldChangedCallback<Tree.Field>): number {

    const field = node.getField(fieldName);
    if (field === undefined) {
        return 0;
    }
    let fieldDefinition: TreeScheme.IFieldDefinition | undefined;
    if (nodeDefinition !== undefined) {
        fieldDefinition = nodeDefinition.getField(fieldName);
    }
    const fieldSize = { x: positionLookup.getSize(node).x, y: Tree.PositionLookup.getFieldHeight(field) };
    const centeredYOffset = yOffset + Utils.half(nodeFieldHeight);
    const nameWidth = Utils.half(fieldSize.x) + 20;

    parent.addRect(`${field.kind}-value-background`, fieldSize, { x: 0, y: yOffset });
    parent.addText(
        "fieldname",
        `${field.name}:`,
        { x: 10, y: centeredYOffset },
        { x: nameWidth - 45, y: nodeFieldHeight });

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
            changed(Tree.Modifications.fieldWithValue(field, newElement as Tree.FieldValueType<T>));
        });
    }

    function createArrayFieldValue<T extends Tree.ArrayField>(
        field: T,
        changed: fieldChangedCallback<T>): void {

        const array = field.value as ReadonlyArray<Tree.FieldElementType<T>>;

        /* NOTE: There are some ugly casts here because the type-system cannot quite follow what
        we are doing here. */

        // Add element button
        parent.addGraphics("fieldvalue-button", "arrayAdd", { x: nameWidth - 15, y: centeredYOffset }, () => {
            if (fieldDefinition === undefined) {
                throw new Error("Unable to create a new element without a FieldDefinition");
            }
            const newElement = TreeScheme.Instantiator.createNewElement(fieldDefinition.valueType);
            const newArray = array.concat(newElement as Tree.FieldElementType<T>);
            changed(Tree.Modifications.fieldWithValue(field, newArray as unknown as Tree.FieldValueType<T>));
        });

        for (let i = 0; i < field.value.length; i++) {
            const element = array[i];
            const yOffset = i * nodeFieldHeight;
            const yPos = centeredYOffset + yOffset;

            // Element deletion button
            parent.addGraphics("fieldvalue-button", "arrayDelete", { x: nameWidth, y: yPos }, () => {
                const newArray = Utils.withoutElement(array, i);
                changed(Tree.Modifications.fieldWithValue(field, newArray as unknown as Tree.FieldValueType<T>));
            });

            // Reorder buttons
            parent.addGraphics("fieldvalue-button", "arrayOrderUp", { x: nameWidth + 12, y: yPos - 5 }, () => {
                const newArray = Utils.withSwappedElements(array, i, (i === 0 ? array.length : i) - 1);
                changed(Tree.Modifications.fieldWithValue(field, newArray as unknown as Tree.FieldValueType<T>));
            });
            parent.addGraphics("fieldvalue-button", "arrayOrderDown", { x: nameWidth + 12, y: yPos + 5 }, () => {
                const newArray = Utils.withSwappedElements(array, i, (i + 1) % array.length);
                changed(Tree.Modifications.fieldWithValue(field, newArray as unknown as Tree.FieldValueType<T>));
            });

            // Element value
            createElementValue(element, 20, yOffset, newElement => {
                changed(Tree.Modifications.fieldWithElement(field, newElement, i));
            });
        }
    }

    type elementChangedCallback<T extends Tree.FieldElement> = (newText: T) => void;

    function createElementValue<T extends Tree.FieldElement>(
        element: T,
        xOffset: number,
        yOffset: number,
        changed: elementChangedCallback<T>): void {

        const pos: Vector.Position = { x: nameWidth + xOffset, y: centeredYOffset + yOffset };
        const size: Vector.Size = { x: fieldSize.x - pos.x, y: nodeFieldHeight };
        switch (typeof element) {
            case "string": createStringValue(element, pos, size, changed as elementChangedCallback<string>); break;
            case "number": createNumberValue(element, pos, size, changed as elementChangedCallback<number>); break;
            case "boolean": createBooleanValue(element, pos, size, changed as elementChangedCallback<boolean>); break;
            default: createNodeValue(element as Tree.INode, pos, size); break;
        }
    }

    function createStringValue(
        value: string,
        pos: Vector.Position,
        size: Vector.Size,
        changed: elementChangedCallback<string>): void {

        parent.addEditableText("string-value", value, pos, size, changed);
    }

    function createNumberValue(
        value: number,
        pos: Vector.Position,
        size: Vector.Size,
        changed: elementChangedCallback<number>): void {

        // If the number is an enumeration then display it as a dropdown.
        if (fieldDefinition !== undefined) {
            const enumeration = TreeScheme.validateEnumType(fieldDefinition.valueType);
            if (enumeration !== undefined) {
                const currentIndex = enumeration.values.findIndex(entry => entry.value === value);
                const options = enumeration.values.map(entry => entry.name);
                parent.addDropdown("enum-value", currentIndex, options, pos, size, newIndex => {
                    changed(enumeration.values[newIndex].value);
                });
                return;
            }
        }

        // Otherwise display it as a number input.
        parent.addEditableNumber("number-value", value, pos, size, changed);
    }

    function createBooleanValue(
        value: boolean,
        pos: Vector.Position,
        size: Vector.Size,
        changed: elementChangedCallback<boolean>): void {

        parent.addEditableBoolean("boolean-value", value, pos, size, changed);
    }

    function createNodeValue(
        value: Tree.INode,
        pos: Vector.Position,
        size: Vector.Size): void {

        addConnection(parent, { x: fieldSize.x - 12, y: pos.y }, getRelativeVector(node, value, positionLookup));
    }
}

function addConnection(parent: Svg.IElement, from: Vector.Position, to: Vector.Position): void {
    parent.addGraphics("nodeOutput", "nodeConnector", from);

    const target = Vector.add(to, nodeInputSlotOffset);
    const c1 = { x: Utils.lerp(from.x, target.x, nodeConnectionCurviness), y: from.y };
    const c2 = { x: Utils.lerp(target.x, from.x, nodeConnectionCurviness), y: target.y };
    parent.addBezier("connection", from, c1, c2, target);
}

function getRelativeVector(
    from: Tree.INode,
    to: Tree.INode,
    positionLookup: Tree.PositionLookup.IPositionLookup): Vector.IVector2 {

    return Vector.subtract(positionLookup.getPosition(to), positionLookup.getPosition(from));
}

function getTypeOptions(typeLookup: TreeScheme.TypeLookup.ITypeLookup, node: Tree.INode): Tree.NodeType[] {
    const alias = typeLookup.getAlias(node);
    const result = alias.values.slice();
    // Add the none-type
    result.unshift(Tree.noneNodeType);
    return result;
}
