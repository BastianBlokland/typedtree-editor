import * as Utils from "./utils";

export type NodeType = string

export interface Node {
    readonly type: NodeType
    readonly fields: ReadonlyArray<Field>
    readonly fieldNames: ReadonlyArray<string>

    getField(name: string): Field | undefined
}

export type Field =
    StringField |
    NumberField |
    BooleanField |
    NodeField |
    StringArrayField |
    NumberArrayField |
    BooleanArrayField |
    NodeArrayField

export interface StringField {
    readonly kind: "string"
    readonly name: string
    readonly value: string
}

export interface NumberField {
    readonly kind: "number"
    readonly name: string
    readonly value: number
}

export interface BooleanField {
    readonly kind: "boolean"
    readonly name: string
    readonly value: boolean
}

export interface NodeField {
    readonly kind: "node"
    readonly name: string
    readonly value: Node
}

export interface StringArrayField {
    readonly kind: "stringArray"
    readonly name: string
    readonly value: ReadonlyArray<string>
}

export interface NumberArrayField {
    readonly kind: "numberArray"
    readonly name: string
    readonly value: ReadonlyArray<number>
}

export interface BooleanArrayField {
    readonly kind: "booleanArray"
    readonly name: string
    readonly value: ReadonlyArray<boolean>
}

export interface NodeArrayField {
    readonly kind: "nodeArray"
    readonly name: string
    readonly value: ReadonlyArray<Node>
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
        switch (field.kind) {
            case "node": callback(field.value); break;
            case "nodeArray": field.value.forEach(callback); break;
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
        switch (field.kind) {
            case "string": printText(`${field.name}: ${field.value}`, indent); break;
            case "number": printText(`${field.name}: ${field.value}`, indent); break;
            case "boolean": printText(`${field.name}: ${field.value}`, indent); break;
            case "node":
                printText(`${field.name}:`, indent);
                printNode(field.value, indent + 1);
                break;
            case "stringArray":
                printText(`${field.name}:`, indent);
                field.value.forEach(element => { printText(element, indent); });
                break;
            case "numberArray":
                printText(`${field.name}:`, indent);
                field.value.forEach(element => { printText(element.toString(), indent); });
                break;
            case "booleanArray":
                printText(`${field.name}:`, indent);
                field.value.forEach(element => { printText(element.toString(), indent); });
                break;
            case "nodeArray":
                printText(`${field.name}:`, indent);
                field.value.forEach(element => { printNode(element, indent + 1); });
                break;
            default: Utils.assertNever(field);
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
        const field: Field = { kind: "string", name: name, value: value };
        return this.pushField(field);
    }

    pushNumberField(name: string, value: number): boolean {
        const field: Field = { kind: "number", name: name, value: value };
        return this.pushField(field);
    }

    pushBooleanField(name: string, value: boolean): boolean {
        const field: Field = { kind: "boolean", name: name, value: value };
        return this.pushField(field);
    }

    pushNodeField(name: string, value: Node): boolean {
        const field: Field = { kind: "node", name: name, value: value };
        return this.pushField(field);
    }

    pushStringArrayField(name: string, value: ReadonlyArray<string>): boolean {
        const field: Field = { kind: "stringArray", name: name, value: value };
        return this.pushField(field);
    }

    pushNumberArrayField(name: string, value: ReadonlyArray<number>): boolean {
        const field: Field = { kind: "numberArray", name: name, value: value };
        return this.pushField(field);
    }

    pushBooleanArrayField(name: string, value: ReadonlyArray<boolean>): boolean {
        const field: Field = { kind: "booleanArray", name: name, value: value };
        return this.pushField(field);
    }

    pushNodeArrayField(name: string, value: ReadonlyArray<Node>): boolean {
        const field: Field = { kind: "nodeArray", name: name, value: value };
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
