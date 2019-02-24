/**
 * @file Immutable data-model for representing tree scheme's.
 */

import * as Tree from "./tree";
import * as Utils from "./utils";

/** Possible types a field can have */
export type FieldValueType = "string" | "number" | "boolean" | IAlias;

/** Identifier for a node */
export type NodeIdentifier = string;

/**
 * Tree scheme.
 * Consists out of aliases and nodes.
 * Nodes are the types of nodes that are in this scheme and what kind of fields those nodes have.
 * Aliases are named groups of nodes, for example you can make a 'Conditions' alias that groups
 * all 'Condition' node types, and then you can use that alias in a field of a node. So a node can
 * define a field of type 'Condition' that can then contain any node from the alias.
 */
export interface IScheme {
    readonly rootAlias: IAlias;
    readonly aliases: ReadonlyArray<IAlias>;
    readonly nodes: ReadonlyArray<INodeDefinition>;

    getAlias(identifier: string): ReadonlyArray<string> | undefined;
    getNode(identifier: string): INodeDefinition | undefined;
}

/** Named group of nodes */
export interface IAlias {
    readonly identifier: string;
    readonly values: ReadonlyArray<NodeIdentifier>;

    containsValue(identifier: NodeIdentifier): boolean;
}

/** Definition of a node (what kind of fields it has) */
export interface INodeDefinition {
    readonly identifier: NodeIdentifier;
    readonly fields: ReadonlyArray<IFieldDefinition>;

    getField(name: string): IFieldDefinition | undefined;
}

/** Definition of a field (name and type) */
export interface IFieldDefinition {
    readonly name: string;
    readonly valueType: FieldValueType;
    readonly isArray: boolean;
}

/** Builder that can be used to create a scheme */
export interface ISchemeBuilder {
    pushAlias(identifier: string, values: ReadonlyArray<NodeIdentifier>): IAlias | undefined;
    getAlias(identifier: string): IAlias | undefined;
    pushNodeDefinition(identifier: string, callback?: (builder: INodeDefinitionBuilder) => void): boolean;
}

/** Builder that can be used to create a node definition */
export interface INodeDefinitionBuilder {
    pushField(name: string, valueType: FieldValueType, isArray?: boolean): boolean;
}

/**
 * Construct a new scheme
 * @param rootAliasIdentifier Identifier for the alias that is used for the root-node.
 * @param callback Callback that can be used to define what data should be on the scheme.
 * @returns Newly constructed (immutable) scheme.
 */
export function createScheme(rootAliasIdentifier: string, callback: (builder: ISchemeBuilder) => void): IScheme {
    const builder = new SchemeBuilderImpl(rootAliasIdentifier);
    callback(builder);
    return builder.build();
}

/**
 * Gets a default (the first) definition for an alias.
 * @param scheme Scheme that the alias is part of.
 * @param alias Alias to get the default definition for.
 * @returns Default definition for the alias.
 */
export function getDefaultDefinition(scheme: IScheme, alias: IAlias): INodeDefinition {
    if (alias.values.length === 0) {
        throw new Error("No values have been defined for alias");
    }
    const firstDefinition = scheme.getNode(alias.values[0]);
    if (firstDefinition === undefined) {
        throw new Error("Unable to find definition");
    }
    return firstDefinition;
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
}

/**
 * Get a FieldKind from a field-definition.
 * @param field Definition of a field to get the field-kind for.
 * @returns FieldKind that corresponds for the given field-definition.
 */
export function getFieldKind(field: IFieldDefinition): Tree.FieldKind {
    switch (field.valueType) {
        case "string": return field.isArray ? "stringArray" : "string";
        case "number": return field.isArray ? "numberArray" : "number";
        case "boolean": return field.isArray ? "booleanArray" : "boolean";
        default: return field.isArray ? "nodeArray" : "node";
    }
}

/**
 * Create a string representation for a scheme. (Useful for debugging)
 * @param scheme Scheme to create the string representation for.
 * @returns Newly created string representation of the scheme.
 */
export function toString(scheme: IScheme): string {
    let result = "";
    printScheme(scheme, undefined, (line: string, indent: number) => {
        result += `${" ".repeat(indent * 2)}${line}\n`;
    });
    return result;
}

/**
 * Print a scheme. (Useful for debugging)
 * @param scheme Scheme to print.
 * @param indent How for to indent the lines.
 * @param printLine Method to use for printing the line
 */
export function printScheme(
    scheme: IScheme,
    indent: number = 0,
    printLine: (line: string, indent: number) => void): void {

    // Aliases
    printLine(`RootAlias: '${scheme.rootAlias.identifier}'`, indent);
    printLine(`Aliases: (${scheme.aliases.length})`, indent);
    scheme.aliases.forEach(a => {
        printLine(`-${a.identifier} (${a.values.length})`, indent + 1);
        a.values.forEach(aVal => printLine(aVal, indent + 2));
    });

    // Node definitions
    printLine(`Nodes: (${scheme.nodes.length})`, indent);
    scheme.nodes.forEach(n => {
        printLine(`-${n.identifier} (${n.fields.length})`, indent + 1);
        n.fields.forEach(f => {
            printLine(`${f.name} (${getPrettyFieldValueType(f.valueType, f.isArray)})`, indent + 2);
        });
    });
}

class SchemeImpl implements IScheme {
    private readonly _rootAlias: IAlias;
    private readonly _aliases: ReadonlyArray<IAlias>;
    private readonly _nodes: ReadonlyArray<INodeDefinition>;

    constructor(rootAlias: IAlias, aliases: ReadonlyArray<IAlias>, nodes: ReadonlyArray<INodeDefinition>) {
        // Verify that root-alias exists in the aliases array.
        if (!aliases.some(a => a === rootAlias)) {
            throw new Error("RootAlias must exist in aliases array");
        }
        // Verify that there are no duplicate aliases.
        if (Utils.hasDuplicates(aliases.map(a => a.identifier))) {
            throw new Error("Aliases must be unique");
        }
        // Verify that there are no duplicate nodes.
        if (Utils.hasDuplicates(nodes.map(a => a.identifier))) {
            throw new Error("Node identifier must be unique");
        }
        // Verify that aliases only reference nodes that actually exist.
        if (aliases.length > 0) {
            aliases.map(a => a.values).reduce((a, b) => a.concat(b)).forEach(aliasVal => {
                if (!nodes.some(nodeDef => nodeDef.identifier === aliasVal)) {
                    throw new Error(`Alias defines a value '${aliasVal}' that is not a type in the types array`);
                }
            });
        }

        this._rootAlias = rootAlias;
        this._aliases = aliases;
        this._nodes = nodes;
    }

    get rootAlias(): IAlias {
        return this._rootAlias;
    }

    get aliases(): ReadonlyArray<IAlias> {
        return this._aliases;
    }

    get nodes(): ReadonlyArray<INodeDefinition> {
        return this._nodes;
    }

    public getAlias(identifier: string): ReadonlyArray<string> | undefined {
        const alias = Utils.find(this._aliases, a => a.identifier === identifier);
        return alias === undefined ? undefined : alias.values;
    }

    public getNode(identifier: string): INodeDefinition | undefined {
        return Utils.find(this._nodes, a => a.identifier === identifier);
    }
}

class AliasImpl implements IAlias {
    private readonly _identifier: string;
    private readonly _values: ReadonlyArray<NodeIdentifier>;

    constructor(identifier: string, values: ReadonlyArray<NodeIdentifier>) {
        // Verify that this alias has a identifier
        if (identifier === "") {
            throw new Error("Alias must have a identifier");
        }
        // Verify that the values at least contain 1 entry and no duplicates
        if (values.length === 0) {
            throw new Error("Alias must have at least one value");
        }
        if (Utils.hasDuplicates(values)) {
            throw new Error("Alias values must be unique");
        }

        this._identifier = identifier;
        this._values = values;
    }

    get identifier(): string {
        return this._identifier;
    }

    get values(): ReadonlyArray<NodeIdentifier> {
        return this._values;
    }

    public containsValue(identifier: NodeIdentifier): boolean {
        return this._values.indexOf(identifier) >= 0;
    }
}

class NodeDefinitionImpl implements INodeDefinition {
    private readonly _identifier: string;
    private readonly _fields: ReadonlyArray<IFieldDefinition>;

    constructor(identifier: string, fields: ReadonlyArray<IFieldDefinition>) {
        // Verify that this nodescheme has a identifier
        if (identifier === "") {
            throw new Error("NodeScheme must have an identifier");
        }
        // Verify that all fields have unique names
        if (Utils.hasDuplicates(fields)) {
            throw new Error("Field names must be unique");
        }

        this._identifier = identifier;
        this._fields = fields;
    }

    get identifier(): string {
        return this._identifier;
    }

    get fields(): ReadonlyArray<IFieldDefinition> {
        return this._fields;
    }

    public getField(name: string): IFieldDefinition | undefined {
        return Utils.find(this._fields, f => f.name === name);
    }
}

class SchemeBuilderImpl implements ISchemeBuilder {
    private _rootAliasIdentifier: string;
    private _aliases: IAlias[];
    private _nodes: INodeDefinition[];
    private _build: boolean;

    constructor(rootAliasIdentifier: string) {
        this._rootAliasIdentifier = rootAliasIdentifier;
        this._aliases = [];
        this._nodes = [];
    }

    public pushAlias(identifier: string, values: ReadonlyArray<NodeIdentifier>): IAlias | undefined {
        // New content cannot be pushed after building the scheme
        if (this._build) {
            return undefined;
        }

        // Aliases have to unique
        if (this._aliases.some(existingAlias => existingAlias.identifier === identifier)) {
            return undefined;
        }

        const alias = new AliasImpl(identifier, values);
        this._aliases.push(alias);
        return alias;
    }

    public getAlias(identifier: string): IAlias | undefined {
        return Utils.find(this._aliases, a => a.identifier === identifier);
    }

    public pushNodeDefinition(identifier: string, callback?: (builder: INodeDefinitionBuilder) => void): boolean {
        // New content cannot be pushed after building the scheme
        if (this._build) {
            return false;
        }

        // Node definitions have to unique
        if (this._nodes.some(existingNode => existingNode.identifier === identifier)) {
            return false;
        }

        if (callback === undefined) {
            this._nodes.push(new NodeDefinitionImpl(identifier, []));
        } else {
            const builder = new NodeDefinitionBuilderImpl(identifier);
            callback(builder);
            this._nodes.push(builder.build());
        }
        return true;
    }

    public build(): IScheme {
        this._build = true;
        const rootAlias = this.getAlias(this._rootAliasIdentifier);
        if (rootAlias === undefined) {
            throw new Error(`Root alias '${this._rootAliasIdentifier}' not found in alias set`);
        }
        return new SchemeImpl(rootAlias, this._aliases, this._nodes);
    }
}

class NodeDefinitionBuilderImpl implements INodeDefinitionBuilder {
    private readonly _identifier: string;
    private _fields: IFieldDefinition[];
    private _build: boolean;

    constructor(identifier: string) {
        this._identifier = identifier;
        this._fields = [];
    }

    public pushField(name: string, valueType: FieldValueType, isArray?: boolean): boolean {
        // New content cannot be pushed after building the definition
        if (this._build) {
            return false;
        }

        // Fields have to unique
        if (this._fields.some(existingField => existingField.name === name)) {
            return false;
        }

        this._fields.push({
            name,
            valueType,
            isArray: isArray === undefined ? false : isArray,
        });
        return true;
    }

    public build(): INodeDefinition {
        this._build = true;
        return new NodeDefinitionImpl(this._identifier, this._fields);
    }
}
