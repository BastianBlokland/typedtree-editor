import * as Utils from "./utils";

export type NodeType = string

export interface Node {
    readonly type: NodeType
    readonly fields: ReadonlyArray<Field>
    readonly fieldNames: ReadonlyArray<string>

    getField(name: string): Field | undefined
}

export interface Field {
    readonly name: string
    readonly value: FieldType
}

export type FieldType =
    FieldString |
    FieldNumber |
    FieldBoolean |
    FieldNode |
    FieldStringArray |
    FieldNumberArray |
    FieldBooleanArray |
    FieldNodeArray

export interface FieldString {
    readonly kind: "string"
    readonly primitive: string
}

export interface FieldNumber {
    readonly kind: "number"
    readonly primitive: number
}

export interface FieldBoolean {
    readonly kind: "boolean"
    readonly primitive: boolean
}

export interface FieldNode {
    readonly kind: "node"
    readonly node: Node
}

export interface FieldStringArray {
    readonly kind: "stringArray"
    readonly array: ReadonlyArray<string>
}

export interface FieldNumberArray {
    readonly kind: "numberArray"
    readonly array: ReadonlyArray<number>
}

export interface FieldBooleanArray {
    readonly kind: "booleanArray"
    readonly array: ReadonlyArray<boolean>
}

export interface FieldNodeArray {
    readonly kind: "nodeArray"
    readonly array: ReadonlyArray<Node>
}

export interface NodeBuilder {
    pushStringField(name: string, value: string): void
    pushNumberField(name: string, value: number): void
    pushBooleanField(name: string, value: boolean): void
    pushNodeField(name: string, value: Node): void
    pushStringArrayField(name: string, value: ReadonlyArray<string>): void
    pushNumberArrayField(name: string, value: ReadonlyArray<number>): void
    pushBooleanArrayField(name: string, value: ReadonlyArray<boolean>): void
    pushNodeArrayField(name: string, value: ReadonlyArray<Node>): void
}

export type NodeCallback = (node: Node) => void

export type BuildCallback = (builder: NodeBuilder) => void

export function createNode(type: NodeType, callback: BuildCallback | undefined = undefined): Node {
    if (callback === undefined)
        return new NodeImpl(type, []);
    let builder = new NodeBuilderImpl(type);
    callback(builder);
    return builder.build();
}

export function getNodeCount(node: Node): number {
    let count = 1;
    forEachDirectChild(node, child => {
        count += getNodeCount(child);
    });
    return count;
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

export function getAllChildren(node: Node): Node[] {
    let result: Node[] = [];
    forEachDirectChild(node, child => addAllChildren(child, result));
    return result;

    function addAllChildren(node: Node, result: Node[]) {
        result.push(node);
        forEachDirectChild(node, child => addAllChildren(child, result));
    }
}

export function getFieldName(field: Field): string { return field.name }

export function printNode(node: Node, indent: number = 0): void {
    // Print type
    printText(`Type: ${node.type}`, indent);

    // Print fields
    node.fields.forEach(field => {
        switch (field.value.kind) {
            case "string": printText(`${field.name}: ${field.value.primitive}`, indent); break;
            case "number": printText(`${field.name}: ${field.value.primitive}`, indent); break;
            case "boolean": printText(`${field.name}: ${field.value.primitive}`, indent); break;
            case "node":
                printText(`${field.name}:`, indent);
                printNode(field.value.node, indent + 1);
                break;
            case "stringArray":
                printText(`${field.name}:`, indent);
                field.value.array.forEach(arrayString => { printText(arrayString, indent); });
                break;
            case "numberArray":
                printText(`${field.name}:`, indent);
                field.value.array.forEach(arrayNumber => { printText(arrayNumber.toString(), indent); });
                break;
            case "booleanArray":
                printText(`${field.name}:`, indent);
                field.value.array.forEach(arrayBoolean => { printText(arrayBoolean.toString(), indent); });
                break;
            case "nodeArray":
                printText(`${field.name}:`, indent);
                field.value.array.forEach(arrayNode => { printNode(arrayNode, indent + 1); });
                break;
            default: Utils.assertNever(field.value);
        }
    });

    function printText(text: string, indent: number) {
        console.log(`${" ".repeat(indent * 4)}${text}`);
    }
}

class NodeImpl implements Node {
    private readonly _type: NodeType;
    private readonly _fields: ReadonlyArray<Field>;

    constructor(type: NodeType, fields: ReadonlyArray<Field>) {
        if (!type || type == "")
            throw new Error("Node must has a type");
        if (Utils.hasDuplicates(fields.map(getFieldName)))
            throw new Error("Field names must be unique");

        this._type = type;
        this._fields = fields;
    }

    get type(): NodeType {
        return this._type;
    }

    get fields(): ReadonlyArray<Field> {
        return this._fields;
    }

    get fieldNames(): ReadonlyArray<string> {
        return this._fields.map(getFieldName);
    }

    getField(name: string): Field | undefined {
        let index = this._fields.findIndex(field => field.name == name);
        return index >= 0 ? this._fields[index] : undefined;
    }
}

class NodeBuilderImpl implements NodeBuilder {
    private readonly _type: NodeType;
    private _fields: Field[];
    private _build: boolean;

    constructor(type: NodeType) {
        this._type = type;
        this._fields = [];
    }

    pushStringField(name: string, value: string): boolean {
        const field: Field = { name: name, value: { kind: "string", primitive: value } };
        return this.pushField(field);
    }

    pushNumberField(name: string, value: number): boolean {
        const field: Field = { name: name, value: { kind: "number", primitive: value } };
        return this.pushField(field);
    }

    pushBooleanField(name: string, value: boolean): boolean {
        const field: Field = { name: name, value: { kind: "boolean", primitive: value } };
        return this.pushField(field);
    }

    pushNodeField(name: string, value: Node): boolean {
        const field: Field = { name: name, value: { kind: "node", node: value } };
        return this.pushField(field);
    }

    pushStringArrayField(name: string, value: ReadonlyArray<string>): boolean {
        const field: Field = { name: name, value: { kind: "stringArray", array: value } };
        return this.pushField(field);
    }

    pushNumberArrayField(name: string, value: ReadonlyArray<number>): boolean {
        const field: Field = { name: name, value: { kind: "numberArray", array: value } };
        return this.pushField(field);
    }

    pushBooleanArrayField(name: string, value: ReadonlyArray<boolean>): boolean {
        const field: Field = { name: name, value: { kind: "booleanArray", array: value } };
        return this.pushField(field);
    }

    pushNodeArrayField(name: string, value: ReadonlyArray<Node>): boolean {
        const field: Field = { name: name, value: { kind: "nodeArray", array: value } };
        return this.pushField(field);
    }

    build(): Node {
        this._build = true;
        return new NodeImpl(this._type, this._fields);
    }

    private pushField(field: Field): boolean {
        // New fields cannot be pushed after building the node
        if (this._build)
            return false;

        // Field names have to unique
        if (this._fields.some(existingField => existingField.name == field.name))
            return false;

        this._fields.push(field);
        return true;
    }
}
