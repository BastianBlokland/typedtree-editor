import * as Utils from "./utils";

export type NodeType = string

export interface Node {
    readonly type: NodeType
    readonly fields: ReadonlyArray<Field>
}

export interface Field {
    readonly name: string
    readonly value: FieldType
}

export type FieldType = FieldNode | FieldNodeArray

export interface FieldNode {
    readonly kind: "node"
    readonly node: Node
}

export interface FieldNodeArray {
    readonly kind: "nodeArray"
    readonly array: ReadonlyArray<Node>
}

export interface NodeBuilder {
    pushNodeField(name: string, value: Node): void
    pushNodeArrayField(name: string, value: ReadonlyArray<Node>): void
}

export type NodeCallback = (node: Node) => void

export type BuildCallback = (builder: NodeBuilder) => void

export function createNode(type: NodeType, callback: BuildCallback | undefined = undefined): Node {
    if (callback === undefined)
        return new TreeNode(type, []);
    let builder = new TreeNodeBuilder(type);
    callback(builder);
    return builder.build();
}

export function forEachDirectChild(node: Node, callback: NodeCallback): void {
    node.fields.forEach(field => {
        switch (field.value.kind) {
            case "node": callback(field.value.node); break;
            case "nodeArray": field.value.array.forEach(callback); break;
        }
    });
}

export function getDirectChildren(node: Node): Node[] {
    let result: Node[] = [];
    forEachDirectChild(node, child => result.push(child));
    return result;
}

export function printNode(node: Node, indent: number = 0): void {
    // Print type
    printText(`Type: ${node.type}`, indent);

    // Print fields
    node.fields.forEach(field => {
        switch (field.value.kind) {
            case "node":
                printText(`${field.name}:`, indent);
                printNode(field.value.node, indent + 1);
                break;
            case "nodeArray":
                printText(`${field.name}:`, indent);
                field.value.array.forEach(arrayNode => {
                    printNode(arrayNode, indent + 1);
                    console.log(""); // Newline between array entries
                });
                break;
            default: Utils.assertNever(field.value);
        }
    });

    function printText(text: string, indent: number) {
        console.log(`${" ".repeat(indent * 4)}${text}`);
    }
}

class TreeNode implements Node {
    private readonly _type: NodeType;
    private readonly _fields: ReadonlyArray<Field>;

    constructor(type: NodeType, fields: ReadonlyArray<Field>) {
        if (!type || type == "")
            throw new Error("Node must has a type");
        this._type = type;
        this._fields = fields;
    }

    get type(): NodeType {
        return this._type;
    }

    get fields(): ReadonlyArray<Field> {
        return this._fields;
    }
}

class TreeNodeBuilder implements NodeBuilder {
    private readonly _type: NodeType;
    private _fields: Field[];
    private _build: boolean;

    constructor(type: NodeType) {
        this._type = type;
        this._fields = [];
    }

    pushNodeField(name: string, value: Node): void {
        const field: Field = { name: name, value: { kind: "node", node: value } };
        this.pushField(field);
    }

    pushNodeArrayField(name: string, value: ReadonlyArray<Node>): void {
        const field: Field = { name: name, value: { kind: "nodeArray", array: value } };
        this.pushField(field);
    }

    build(): Node {
        this._build = true;
        return new TreeNode(this._type, this._fields);
    }

    private pushField(field: Field): void {
        if (this._build)
            throw new Error("New fields cannot be pushed after building the node");
        this._fields.push(field);
    }
}
