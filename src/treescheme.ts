import * as Utils from "./utils";

/** Possible types a field can have */
export type FieldValueType = "string" | "number" | "boolean" | NodeAlias

/** Identifier for a node */
export type NodeIdentifier = string;

/** Tree scheme.
 * Consists out of aliases and nodes.
 * Nodes are the types of nodes that are in this scheme and what kind of fields those nodes have.
 * Aliases are named groups of nodes, for example you can make a 'Conditions' alias that groups
 * all 'Condition' node types, and then you can use that alias in a field of a node. So a node can
 * define a field of type 'Condition' that can then contain any node from the alias. */
export interface Scheme {
    readonly nodeAliases: ReadonlyArray<NodeAlias>
    readonly nodes: ReadonlyArray<NodeDefinition>
}

/** Named group of nodes */
export interface NodeAlias {
    readonly identifier: string
    readonly values: ReadonlyArray<NodeIdentifier>
}

/** Definition of a node (what kind of fields it has) */
export interface NodeDefinition {
    readonly identifier: NodeIdentifier
    readonly fields: ReadonlyArray<FieldDefinition>
}

/** Definition of a field (name and type) */
export interface FieldDefinition {
    readonly name: string,
    readonly valueType: FieldValueType,
    readonly isArray: boolean
}

/** Builder that can be used to create a scheme */
export interface SchemeBuilder {
    pushAlias(identifier: string, values: ReadonlyArray<NodeIdentifier>): NodeAlias | undefined
    pushNodeDefinition(identifier: string, callback?: (builder: NodeDefinitionBuilder) => void): boolean
}

/** Builder that can be used to create a node definition */
export interface NodeDefinitionBuilder {
    pushField(name: string, valueType: FieldValueType, isArray: boolean): boolean
}

/**
 * Construct a new scheme
 * @param callback Callback that can be used to define what data should be on the scheme.
 * @returns Newly constructed (immutable) scheme.
 */
export function createScheme(callback: (builder: SchemeBuilder) => void): Scheme {
    const builder = new SchemeBuilderImpl();
    callback(builder);
    return builder.build();
}

/**
 * Create a pretty looking string (for example 'string[]') from a field type. (Usefully for debugging)
 * @param valueType Type of the field.
 * @param isArray Is this field an array.
 * @returns string to represent the field type.
 */
export function getPrettyFieldValueType(valueType: FieldValueType, isArray: boolean = false): string {
    switch (valueType) {
        case "string":
        case "number":
        case "boolean":
            return `${valueType}${isArray ? "[]" : ""}`;
        default: // In this case its actually an alias so we return its identifier
            return `${valueType.identifier}${isArray ? "[]" : ""}`;
    }
    return "";
}

/**
 * Print the scheme to the console (Useful for debugging).
 * @param scheme Scheme to print.
 * @param indent How for to indent the lines.
 */
export function printScheme(scheme: Scheme, indent: number = 0): void {
    // Aliases
    printText(`Aliases: (${scheme.nodeAliases.length})`, indent);
    scheme.nodeAliases.forEach(a => {
        printText(`${a.identifier} (${a.values.length})`, indent + 1);
        a.values.forEach(aVal => printText(aVal, indent + 2));
    });

    // Node definitions
    printText(`Nodes: (${scheme.nodes.length})`, indent);
    scheme.nodes.forEach(n => {
        printText(`${n.identifier} (${n.fields.length})`, indent + 1);
        n.fields.forEach(f => {
            printText(`${f.name} (${getPrettyFieldValueType(f.valueType, f.isArray)})`, indent + 2);
        });
    });

    function printText(text: string, indent: number) {
        console.log(`${" ".repeat(indent * 2)}${text}`);
    }
}

class SchemeImpl implements Scheme {
    private readonly _nodeAliases: ReadonlyArray<NodeAlias>;
    private readonly _nodes: ReadonlyArray<NodeDefinition>;

    constructor(aliases: ReadonlyArray<NodeAlias>, nodes: ReadonlyArray<NodeDefinition>) {
        // Verify that there are no duplicate aliases.
        if (Utils.hasDuplicates(aliases.map(a => a.identifier)))
            throw new Error("Aliases must be unique");
        // Verify that there are no duplicate nodes.
        if (Utils.hasDuplicates(nodes.map(a => a.identifier)))
            throw new Error("Node identifier must be unique");
        // Verify that aliases only reference nodes that actually exist.
        aliases.map(a => a.values).reduce((a, b) => a.concat(b)).forEach(aliasVal => {
            if (!nodes.some(nodeDef => nodeDef.identifier === aliasVal))
                throw new Error(`Alias defines a value '${aliasVal}' that is not a type in the types array`);
        });

        this._nodeAliases = aliases;
        this._nodes = nodes;
    }

    get nodeAliases(): ReadonlyArray<NodeAlias> {
        return this._nodeAliases;
    }

    get nodes(): ReadonlyArray<NodeDefinition> {
        return this._nodes;
    }
}

class NodeAliasImpl implements NodeAlias {
    private readonly _identifier: string;
    private readonly _values: ReadonlyArray<NodeIdentifier>;

    constructor(identifier: string, values: ReadonlyArray<NodeIdentifier>) {
        // Verify that this alias has a identifier
        if (identifier === "")
            throw new Error("Alias must have a identifier");
        // Verify that the values at least contain 1 entry and no duplicates
        if (values.length === 0)
            throw new Error("Alias must have at least one value");
        if (Utils.hasDuplicates(values))
            throw new Error("Alias values must be unique");

        this._identifier = identifier;
        this._values = values;
    }

    get identifier(): string {
        return this._identifier;
    }

    get values(): ReadonlyArray<NodeIdentifier> {
        return this._values;
    }
}

class NodeDefinitionImpl implements NodeDefinition {
    private readonly _identifier: string;
    private readonly _fields: ReadonlyArray<FieldDefinition>;

    constructor(identifier: string, fields: ReadonlyArray<FieldDefinition>) {
        // Verify that this nodescheme has a identifier
        if (identifier === "")
            throw new Error("NodeScheme must have an identifier");
        // Verify that all fields have unique names
        if (Utils.hasDuplicates(fields))
            throw new Error("Field names must be unique");

        this._identifier = identifier;
        this._fields = fields;
    }

    get identifier(): string {
        return this._identifier;
    }

    get fields(): ReadonlyArray<FieldDefinition> {
        return this._fields;
    }
}

class SchemeBuilderImpl implements SchemeBuilder {
    private _nodeAliases: NodeAlias[];
    private _nodes: NodeDefinition[];
    private _build: boolean;

    constructor() {
        this._nodeAliases = [];
        this._nodes = [];
    }

    pushAlias(identifier: string, values: ReadonlyArray<NodeIdentifier>): NodeAlias | undefined {
        // New content cannot be pushed after building the scheme
        if (this._build)
            return undefined;

        // Aliases have to unique
        if (this._nodeAliases.some(existingAlias => existingAlias.identifier === identifier))
            return undefined;

        const alias = new NodeAliasImpl(identifier, values);
        this._nodeAliases.push(alias);
        return alias;
    }

    pushNodeDefinition(identifier: string, callback?: (builder: NodeDefinitionBuilder) => void): boolean {
        // New content cannot be pushed after building the scheme
        if (this._build)
            return false;

        // Node definitions have to unique
        if (this._nodes.some(existingNode => existingNode.identifier === identifier))
            return false;

        if (callback === undefined)
            this._nodes.push(new NodeDefinitionImpl(identifier, []));
        else {
            const builder = new NodeDefinitionBuilderImpl(identifier);
            callback(builder);
            this._nodes.push(builder.build());
        }
        return true;
    }

    build(): Scheme {
        this._build = true;
        return new SchemeImpl(this._nodeAliases, this._nodes);
    }
}

class NodeDefinitionBuilderImpl implements NodeDefinitionBuilder {
    private readonly _identifier: string;
    private _fields: FieldDefinition[];
    private _build: boolean;

    constructor(identifier: string) {
        this._identifier = identifier;
        this._fields = [];
    }

    pushField(name: string, valueType: FieldValueType, isArray: boolean): boolean {
        // New content cannot be pushed after building the definition
        if (this._build)
            return false;

        // Fields have to unique
        if (this._fields.some(existingField => existingField.name === name))
            return false;

        this._fields.push({ name: name, valueType: valueType, isArray: isArray });
        return true;
    }

    build(): NodeDefinition {
        this._build = true;
        return new NodeDefinitionImpl(this._identifier, this._fields);
    }
}
