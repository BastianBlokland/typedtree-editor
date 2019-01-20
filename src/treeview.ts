import * as Tree from "./tree";
import * as Vec from "./vector";
import * as Display from "./display";

export function initialize(): void {
    Display.initialize();
}

export function setTree(treeRoot: Tree.Node): void {
    Display.clear();
    displayNode(treeRoot, { x: 200, y: 100 });
}

const nodeHeaderHeight = 20;
const nodePadding = 10;
const nodeWidth = 200;
const nodeHorizontalSpacing = 100;
const nodeVerticalSpacing = 25;
const nodeAttachPointRadius = 10;
const nodeAttachPointOffset = 15;
const fieldElementHeight = 25;

function displayNode(node: Tree.Node, center: Vec.Position): void {
    let nodeHeight = getNodeHeight(node);
    let nodeSize: Vec.Size = { x: nodeWidth, y: nodeHeight };

    let nodeElement = Display.createElement("node", Vec.subtract(center, Vec.half(nodeSize)));
    nodeElement.addRect("nodeBackground", nodeSize, Vec.zeroVector);
    nodeElement.addText("nodeTypeText", node.type, { x: nodeSize.x * .5, y: 0 });
    nodeElement.addLine("nodeTypeSeparator", { x: 0, y: nodeHeaderHeight }, { x: nodeSize.x, y: nodeHeaderHeight });

    let yOffset = nodeHeaderHeight + (nodePadding * .5);
    node.fields.forEach(field => {

        let fieldElement = nodeElement.addElement("nodeField", { x: 0, y: yOffset });
        fieldElement.addText("nodeFieldName", field.name, { x: nodePadding * .5, y: 0 });

        switch (field.value.kind) {
            case "node":
                fieldElement.addCircle(
                    "nodeAttachPoint",
                    nodeAttachPointRadius,
                    { x: nodeSize.x - nodeAttachPointOffset, y: 5 });
                break;
            case "nodeArray":
                let elementOffset = 0;
                field.value.array.forEach(arrayNode => {
                    fieldElement.addCircle(
                        "nodeAttachPoint",
                        nodeAttachPointRadius,
                        { x: nodeSize.x - nodeAttachPointOffset, y: elementOffset + 5 });

                    elementOffset += fieldElementHeight;
                });
                yOffset += elementOffset;
                break;
        }
        yOffset += fieldElementHeight;
    });
}

function getHeightOfNodeAndChildren(node: Tree.Node): number {
    // return either our own height or our children's height whichever is higher.
    return max(
        getNodeHeight(node),
        Tree.getDirectChildren(node).map(getHeightOfNodeAndChildren).reduce(add));
}

function getNodeHeight(node: Tree.Node): number {
    return nodeHeaderHeight + nodePadding + node.fields.map(getFieldHeight).reduce(add);
}

function getFieldHeight(field: Tree.Field): number {
    switch (field.value.kind) {
        case "node":
            return fieldElementHeight;
        case "nodeArray":
            return fieldElementHeight * field.value.array.length;
        default:
            assertNever(field.value);
            return 0;
    }
}

function max(a: number, b: number) {
    return a > b ? a : b;
}

function add(a: number, b: number) {
    return a + b;
}

function assertNever(x: never): never {
    throw new Error(`Unexpected object: ${x}`);
}
