import * as Utils from "./utils";

/** Identifier for the node-type */
export type NodeType = string

/** Extracts the type of the value of a given field. */
export type FieldValueType<T> = T extends Field ? T["value"] : never;

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

/** Union type of all possible fields. */
export type Field =
    StringField |
    NumberField |
    BooleanField |
    NodeField |
    StringArrayField |
    NumberArrayField |
    BooleanArrayField |
    NodeArrayField

/** Immutable structure representing a single node in the tree. */
export interface Node {
    readonly type: NodeType
    readonly fields: ReadonlyArray<Field>
    readonly fieldNames: ReadonlyArray<string>

    getField(name: string): Field | undefined
    getChild(output: FieldElementIdentifier): Node | undefined;
}

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

/* Identifier for a single element of a field, for non-arrays the offset will the 0. For arrays the
offset will be the index into the array. */
export interface FieldElementIdentifier {
    readonly fieldName: string
    readonly offset: number
}

/** Object that can be used to construct new nodes */
export interface NodeBuilder {
    pushStringField(name: string, value: string): boolean
    pushNumberField(name: string, value: number): boolean
    pushBooleanField(name: string, value: boolean): boolean
    pushNodeField(name: string, value: Node): boolean
    pushStringArrayField(name: string, value: ReadonlyArray<string>): boolean
    pushNumberArrayField(name: string, value: ReadonlyArray<number>): boolean
    pushBooleanArrayField(name: string, value: ReadonlyArray<boolean>): boolean
    pushNodeArrayField(name: string, value: ReadonlyArray<Node>): boolean
    pushField(field: Field): boolean
}

/**
 * Construct a new node
 * @param type Type of the node to construct
 * @param callback Callback that can be used to add additional data to this node.
 * @returns Newly constructed (immutable) node
 */
export function createNode(type: NodeType, callback?: (builder: NodeBuilder) => void): Node {
    if (callback === undefined)
        return new NodeImpl(type, []);
    const builder = new NodeBuilderImpl(type);
    callback(builder);
    return builder.build();
}

/**
 * Get how many nodes are are in the tree represented by the given node.
 * @param node Root to start counting from.
 * @returns Number of nodes in this tree.
 */
export function getNodeCount(node: Node): number {
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
    node: Node,
    callback: (node: Node, element: FieldElementIdentifier) => boolean | void): void {

    for (let fieldIndex = 0; fieldIndex < node.fields.length; fieldIndex++) {
        const field = node.fields[fieldIndex];

        switch (field.kind) {
            case "node":
                const result = callback(field.value, { fieldName: field.name, offset: 0 });
                if (typeof result === "boolean" && !result)
                    return;
                break;

            case "nodeArray":
                for (let arrayIndex = 0; arrayIndex < field.value.length; arrayIndex++) {
                    const node = field.value[arrayIndex];
                    const result = callback(node, { fieldName: field.name, offset: arrayIndex });
                    if (typeof result === "boolean" && !result)
                        return;
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
export function getDirectChildren(node: Node): Node[] {
    const result: Node[] = [];
    forEachDirectChild(node, child => { result.push(child) });
    return result;
}

/**
 * Get all children of the given node (including grand-children).
 * @param node Node to get the children for.
 * @returns Array containing all the children of the given node.
 */
export function getAllChildren(node: Node): Node[] {
    const result: Node[] = [];
    forEachDirectChild(node, child => addAllChildren(child, result));
    return result;

    function addAllChildren(node: Node, result: Node[]) {
        result.push(node);
        forEachDirectChild(node, child => addAllChildren(child, result));
    }
}

/**
 * Get the name of the given field (Useful to use in higher order functions).
 * @param field To get the name for.
 * @returns Name of the field.
 */
export function getFieldName(field: Field): string { return field.name }

/**
 * Print the tree to the console (Useful for debugging).
 * @param node Node to print (Including its children).
 * @param indent How for to indent the lines.
 */
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
                field.value.forEach(element => { printText(element, indent + 1); });
                break;
            case "numberArray":
                printText(`${field.name}:`, indent);
                field.value.forEach(element => { printText(element.toString(), indent + 1); });
                break;
            case "booleanArray":
                printText(`${field.name}:`, indent);
                field.value.forEach(element => { printText(element.toString(), indent + 1); });
                break;
            case "nodeArray":
                printText(`${field.name}:`, indent);
                field.value.forEach(element => { printNode(element, indent + 1); });
                break;
            default: Utils.assertNever(field);
        }
    });

    function printText(text: string, indent: number) {
        console.log(`${" ".repeat(indent * 2)}${text}`);
    }
}

class NodeImpl implements Node {
    private readonly _type: NodeType;
    private readonly _fields: ReadonlyArray<Field>;

    constructor(type: NodeType, fields: ReadonlyArray<Field>) {
        if (type === "")
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
        return Utils.find(this._fields, field => field.name === name);
    }

    getChild(output: FieldElementIdentifier): Node | undefined {
        const field = this.getField(output.fieldName);
        if (field !== undefined) {
            if (field.kind === "node" && output.offset === 0)
                return field.value;
            if (field.kind === "nodeArray")
                return field.value[output.offset];
        }
        return undefined;
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

    pushField(field: Field): boolean {
        // New fields cannot be pushed after building the node
        if (this._build)
            return false;

        // Field names have to unique
        if (this._fields.some(existingField => existingField.name === field.name))
            return false;

        this._fields.push(field);
        return true;
    }

    build(): Node {
        this._build = true;
        return new NodeImpl(this._type, this._fields);
    }
}
