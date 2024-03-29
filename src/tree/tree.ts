/**
 * @file Immutable data-model for representing tree's.
 */

import * as Utils from "../utils";

/** Identifier for the node-type */
export type NodeType = string;

/**
 * Reserved node-type for anonymous nodes
 * Anonymous type is inserted when no type info is known for a node.
 */
export const anonymousNodeType: NodeType = "<anonymous>";

/**
 * Reserved node-type for none nodes
 * None-nodes are used as defaults and are not exported, also none-nodes cannot have fields.
 */
export const noneNodeType: NodeType = "<none>";

/** Extracts the type of the value of a given field. */
export type FieldValueType<T> = T extends Field ? T["value"] : never;

/** Extracts the kinds of a given field */
export type FieldValueKind<T> = T extends Field ? T["kind"] : never;

/**
 * Extracts the element type of the value of a given field.
 * This means if you request the element type for a 'stringArray' field you will get the type 'string'.
 */
export type FieldElementType<T> =
    T extends Field ? (FieldValueType<T> extends ReadonlyArray<infer U> ? U : FieldValueType<T>) : never;

/** Filters out all non-array fields from a union. */
export type OnlyArrayField<T> =
    T extends Field ? (FieldValueType<T> extends ReadonlyArray<infer U> ? T : never) : never;

/** Filter out all array fields from a union. */
export type OnlyNonArrayField<T> =
    T extends Field ? (FieldValueType<T> extends ReadonlyArray<infer U> ? never : T) : never;

/** Union type of all possible elements in fields. */
export type FieldElement = FieldElementType<Field>;

/** Union type of all possible array fields. */
export type ArrayField = OnlyArrayField<Field>;

/** Union type of all possible non-array fields. */
export type NonArrayField = OnlyNonArrayField<Field>;

/** Union type of all the possible field kinds. */
export type FieldKind = FieldValueKind<Field>;

/** Union type of all possible fields. */
export type Field =
    IStringField |
    INumberField |
    IBooleanField |
    INodeField |
    IStringArrayField |
    INumberArrayField |
    IBooleanArrayField |
    INodeArrayField;

/** Immutable structure representing a single node in the tree. */
export interface INode {
    readonly type: NodeType;
    readonly name?: string;
    readonly fields: ReadonlyArray<Field>;
    readonly fieldNames: ReadonlyArray<string>;

    getField(name: string): Field | undefined;
    getChild(output: IFieldElementIdentifier): INode | undefined;
}

export interface IStringField {
    readonly kind: "string";
    readonly name: string;
    readonly value: string;
}

export interface INumberField {
    readonly kind: "number";
    readonly name: string;
    readonly value: number;
}

export interface IBooleanField {
    readonly kind: "boolean";
    readonly name: string;
    readonly value: boolean;
}

export interface INodeField {
    readonly kind: "node";
    readonly name: string;
    readonly value: INode;
}

export interface IStringArrayField {
    readonly kind: "stringArray";
    readonly name: string;
    readonly value: ReadonlyArray<string>;
}

export interface INumberArrayField {
    readonly kind: "numberArray";
    readonly name: string;
    readonly value: ReadonlyArray<number>;
}

export interface IBooleanArrayField {
    readonly kind: "booleanArray";
    readonly name: string;
    readonly value: ReadonlyArray<boolean>;
}

export interface INodeArrayField {
    readonly kind: "nodeArray";
    readonly name: string;
    readonly value: ReadonlyArray<INode>;
}

/* Identifier for a single element of a field, for non-arrays the offset will the 0. For arrays the
offset will be the index into the array. */
export interface IFieldElementIdentifier {
    readonly fieldName: string;
    readonly offset: number;
}

/** Object that can be used to construct new nodes */
export interface INodeBuilder {
    pushStringField(name: string, value: string): boolean;
    pushNumberField(name: string, value: number): boolean;
    pushBooleanField(name: string, value: boolean): boolean;
    pushNodeField(name: string, value: INode): boolean;
    pushStringArrayField(name: string, value: ReadonlyArray<string>): boolean;
    pushNumberArrayField(name: string, value: ReadonlyArray<number>): boolean;
    pushBooleanArrayField(name: string, value: ReadonlyArray<boolean>): boolean;
    pushNodeArrayField(name: string, value: ReadonlyArray<INode>): boolean;
    pushField(field: Field): boolean;
    pushName(name: string): void;
}

/**
 * Construct a new node
 * @param type Type of the node to construct
 * @param callback Callback that can be used to add additional data to this node.
 * @returns Newly constructed (immutable) node
 */
export function createNode(type: NodeType, callback?: (builder: INodeBuilder) => void): INode {
    if (callback === undefined) {
        return new NodeImpl(type, []);
    }
    const builder = new NodeBuilderImpl(type);
    callback(builder);
    return builder.build();
}

/**
 * Construct a none-node. None-nodes can be used as default values and cannot have any fields or
 * be exported.
 * @returns Newly constructed (immutable) none-node.
 */
export function createNoneNode(): INode {
    return new NodeImpl(noneNodeType, []);
}

/**
 * Get how many nodes are are in the tree represented by the given node.
 * @param node Root to start counting from.
 * @returns Number of nodes in this tree.
 */
export function getNodeCount(node: INode): number {
    let count = 1;
    forEachDirectChild(node, child => {
        count += getNodeCount(child);
    });
    return count;
}

/**
 * Execute a callback for each direct child of the given node (no grand-children included).
 * @param node Node to execute callback on.
 * @param callback Callback to execute for each direct child.
 * Can be short-circuited by returning false from the callback, if void or true is returned the loop
 * will continue.
 */
export function forEachDirectChild(
    node: INode,
    callback: (node: INode, element: IFieldElementIdentifier) => boolean | void): void {

    for (let fieldIndex = 0; fieldIndex < node.fields.length; fieldIndex++) {
        const field = node.fields[fieldIndex];

        switch (field.kind) {
            case "node":
                const result = callback(field.value, { fieldName: field.name, offset: 0 });
                if (typeof result === "boolean" && !result) {
                    return;
                }
                break;

            case "nodeArray":
                for (let arrayIndex = 0; arrayIndex < field.value.length; arrayIndex++) {
                    const node = field.value[arrayIndex];
                    const result = callback(node, { fieldName: field.name, offset: arrayIndex });
                    if (typeof result === "boolean" && !result) {
                        return;
                    }
                }
                break;
        }
    }
}

/**
 * Get all the direct children of the given node (no grand-children included).
 * @param node Node to get the direct children for.
 * @returns Array containing all the direct children of the given node.
 */
export function getDirectChildren(node: INode): INode[] {
    const result: INode[] = [];
    forEachDirectChild(node, child => { result.push(child); });
    return result;
}

/**
 * Get all children of the given node (including grand-children).
 * @param node Node to get the children for.
 * @returns Array containing all the children of the given node.
 */
export function getAllChildren(node: INode): INode[] {
    const result: INode[] = [];
    forEachDirectChild(node, child => addAllChildren(child, result));
    return result;

    function addAllChildren(node: INode, result: INode[]) {
        result.push(node);
        forEachDirectChild(node, child => addAllChildren(child, result));
    }
}

/**
 * Get the name of the given field (Useful to use in higher order functions).
 * @param field To get the name for.
 * @returns Name of the field.
 */
export function getFieldName(field: Field): string { return field.name; }

/**
 * Create a string representation for a node. (Useful for debugging)
 * @param node Node to create the string representation for.
 * @returns Newly created string representation of the node.
 */
export function toString(node: INode): string {
    let result = "";
    printNode(node, undefined, (line: string, indent: number) => {
        result += `${" ".repeat(indent * 2)}${line}\n`;
    });
    return result;
}

/**
 * Print a node. (Useful for debugging)
 * @param node Node to print (Including its children).
 * @param indent How for to indent the lines.
 * @param printLine Method to use for printing the line
 */
export function printNode(node: INode, indent: number = 0, printLine: (line: string, indent: number) => void): void {
    // Print type
    printLine(`Type: ${node.type}`, indent);

    // Print name
    if (node.name !== undefined) {
        printLine(`Name: ${node.name}`, indent);
    }

    // Print fields
    node.fields.forEach(field => {
        switch (field.kind) {
            case "string": printLine(`-${field.name}: ${field.value}`, indent); break;
            case "number": printLine(`-${field.name}: ${field.value}`, indent); break;
            case "boolean": printLine(`-${field.name}: ${field.value}`, indent); break;
            case "node":
                printLine(`-${field.name}:`, indent);
                printNode(field.value, indent + 1, printLine);
                break;
            case "stringArray":
                printLine(`-${field.name}:`, indent);
                field.value.forEach(element => { printLine(element, indent + 1); });
                break;
            case "numberArray":
                printLine(`-${field.name}:`, indent);
                field.value.forEach(element => { printLine(element.toString(), indent + 1); });
                break;
            case "booleanArray":
                printLine(`-${field.name}:`, indent);
                field.value.forEach(element => { printLine(element.toString(), indent + 1); });
                break;
            case "nodeArray":
                printLine(`-${field.name}:`, indent);
                field.value.forEach(element => { printNode(element, indent + 1, printLine); });
                break;
            default: Utils.assertNever(field);
        }
    });
}

class NodeImpl implements INode {
    private readonly _type: NodeType;
    private readonly _fields: ReadonlyArray<Field>;
    private readonly _name?: string;

    constructor(type: NodeType, fields: ReadonlyArray<Field>, name?: string) {
        if (type === "") {
            throw new Error("Node must has a type");
        }
        if (type === noneNodeType && fields.length > 0) {
            throw new Error(`Node of type ${type} cannot have any fields`);
        }
        if (Utils.hasDuplicates(fields.map(getFieldName))) {
            throw new Error("Field names must be unique");
        }

        this._type = type;
        this._fields = fields;
        this._name = name;
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

    get name(): string | undefined {
        return this._name;
    }

    public getField(name: string): Field | undefined {
        return Utils.find(this._fields, field => field.name === name);
    }

    public getChild(output: IFieldElementIdentifier): INode | undefined {
        const field = this.getField(output.fieldName);
        if (field !== undefined) {
            if (field.kind === "node" && output.offset === 0) {
                return field.value;
            }
            if (field.kind === "nodeArray") {
                return field.value[output.offset];
            }
        }
        return undefined;
    }
}

class NodeBuilderImpl implements INodeBuilder {
    private readonly _type: NodeType;
    private _fields: Field[];
    private _name?: string;
    private _build: boolean;

    constructor(type: NodeType) {
        this._type = type;
        this._fields = [];
    }

    public pushStringField(name: string, value: string): boolean {
        const field: Field = { kind: "string", name, value };
        return this.pushField(field);
    }

    public pushNumberField(name: string, value: number): boolean {
        const field: Field = { kind: "number", name, value };
        return this.pushField(field);
    }

    public pushBooleanField(name: string, value: boolean): boolean {
        const field: Field = { kind: "boolean", name, value };
        return this.pushField(field);
    }

    public pushNodeField(name: string, value: INode): boolean {
        const field: Field = { kind: "node", name, value };
        return this.pushField(field);
    }

    public pushStringArrayField(name: string, value: ReadonlyArray<string>): boolean {
        const field: Field = { kind: "stringArray", name, value };
        return this.pushField(field);
    }

    public pushNumberArrayField(name: string, value: ReadonlyArray<number>): boolean {
        const field: Field = { kind: "numberArray", name, value };
        return this.pushField(field);
    }

    public pushBooleanArrayField(name: string, value: ReadonlyArray<boolean>): boolean {
        const field: Field = { kind: "booleanArray", name, value };
        return this.pushField(field);
    }

    public pushNodeArrayField(name: string, value: ReadonlyArray<INode>): boolean {
        const field: Field = { kind: "nodeArray", name, value };
        return this.pushField(field);
    }

    public pushField(field: Field): boolean {
        // New fields cannot be pushed after building the node
        if (this._build) {
            return false;
        }

        // Field names have to unique
        if (this._fields.some(existingField => existingField.name === field.name)) {
            return false;
        }

        this._fields.push(field);
        return true;
    }

    public pushName(name: string) {
        this._name = name;
    }

    public build(): INode {
        this._build = true;
        return new NodeImpl(this._type, this._fields, this._name);
    }
}
