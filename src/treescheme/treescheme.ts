/**
 * @file Immutable data-model for representing tree scheme's.
 */

import * as Tree from "../tree";
import * as Utils from "../utils";

/** Possible types a field can have */
export type FieldValueType = "string" | "number" | "boolean" | IAlias | IEnum;

/** Extract an identifier out of a FieldValueType */
export type FieldValueTypeIdentifier<T extends FieldValueType> =
    T extends string ? T : (T extends IAlias | IEnum ? T["type"] : never);

/** Identifiers for the possible types a field can have */
export type FieldValueTypeIdentifiers = FieldValueTypeIdentifier<FieldValueType>;

/** Convert a scheme FieldValueType to the corresponding tree field type. */
export type TreeType<T extends FieldValueType> = ITreeTypeMap[FieldValueTypeIdentifier<T>];

/** Mapping from scheme FieldValueType to types on the tree */
interface ITreeTypeMap {
    "string": string;
    "number": number;
    "boolean": boolean;
    "alias": Tree.INode;
    "enum": number;
}

/**
 * Tree scheme.
 * Consists out of aliases, enums and nodes.
 * Aliases: Named group of nodes. (For example 'Condition' alias can contain all condition like nodes)
 * Enums: Named set of numbers. (Same as in many programming languages)
 * Nodes: Schemes for all the nodes that can be on this tree, including what fields they have.
 */
export interface IScheme {
    readonly rootAlias: IAlias;
    readonly aliases: ReadonlyArray<IAlias>;
    readonly enums: ReadonlyArray<IEnum>;
    readonly nodes: ReadonlyArray<INodeDefinition>;

    getAlias(identifier: string): IAlias | undefined;
    getEnum(identifier: string): IEnum | undefined;
    getNode(nodeType: Tree.NodeType): INodeDefinition | undefined;
}

/** Named group of nodes */
export interface IAlias {
    readonly type: "alias";
    readonly identifier: string;
    readonly values: ReadonlyArray<Tree.NodeType>;

    containsValue(identifier: Tree.NodeType): boolean;
}

/** Enum entry (Named number) */
export interface IEnumEntry {
    readonly value: number;
    readonly name: string;
}

/** Enumeration (Set of named numbers)  */
export interface IEnum {
    readonly type: "enum";
    readonly identifier: string;
    readonly values: ReadonlyArray<IEnumEntry>;

    getName(value: number): string | undefined;
}

/** Definition of a node (what kind of fields it has) */
export interface INodeDefinition {
    readonly comment: string | undefined;
    readonly nodeType: Tree.NodeType;
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
    pushAlias(identifier: string, values: ReadonlyArray<Tree.NodeType>): IAlias | undefined;
    pushEnum(identifier: string, values: ReadonlyArray<IEnumEntry>): IEnum | undefined;

    getAlias(identifier: string): IAlias | undefined;
    getEnum(identifier: string): IEnum | undefined;
    getAliasOrEnum(identifier: string): IAlias | IEnum | undefined;

    pushNodeDefinition(nodeType: Tree.NodeType, callback?: (builder: INodeDefinitionBuilder) => void): boolean;
}

/** Builder that can be used to create a node definition */
export interface INodeDefinitionBuilder {
    comment: string | undefined;

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
        default: // In this case its an alias or enum, for both we run their identifiers.
            return `${valueType.identifier}${isArray ? "[]" : ""}`;
    }
}

/**
 * Validate that the given 'fieldValueType' is an Alias.
 * @param fieldValueType FieldValueType to check.
 * @returns IAlias if the field value is a Alias, otherwise undefined.
 */
export function validateAliasType(fieldValueType: FieldValueType): IAlias | undefined {
    switch (fieldValueType) {
        case "string":
        case "number":
        case "boolean":
            return undefined;
        default:
            if (fieldValueType.type !== "alias") {
                return undefined;
            }
            return fieldValueType;
    }
}

/**
 * Validate that the given 'fieldValueType' is an Enum.
 * @param fieldValueType FieldValueType to check.
 * @returns IEnum if the field value is a Enum, otherwise undefined.
 */
export function validateEnumType(fieldValueType: FieldValueType): IEnum | undefined {
    switch (fieldValueType) {
        case "string":
        case "number":
        case "boolean":
            return undefined;
        default:
            if (fieldValueType.type !== "enum") {
                return undefined;
            }
            return fieldValueType;
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
        default:
            switch (field.valueType.type) {
                case "alias":
                    return field.isArray ? "nodeArray" : "node";
                case "enum":
                    // Enums are actually represented by numbers (as they are just named numbers)
                    return field.isArray ? "numberArray" : "number";
                default:
                    Utils.assertNever(field.valueType);
            }
    }
    throw new Error("Unexpected field-kind");
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

    // Enums
    printLine(`Enums: (${scheme.enums.length})`, indent);
    scheme.enums.forEach(e => {
        printLine(`-${e.identifier} (${e.values.length})`, indent + 1);
        e.values.forEach(eEntry => printLine(`${eEntry.value}: ${eEntry.name}`, indent + 2));
    });

    // Node definitions
    printLine(`Nodes: (${scheme.nodes.length})`, indent);
    scheme.nodes.forEach(n => {
        printLine(`-${n.nodeType} (${n.fields.length})`, indent + 1);
        n.fields.forEach(f => {
            printLine(`${f.name} (${getPrettyFieldValueType(f.valueType, f.isArray)})`, indent + 2);
        });
    });
}

class SchemeImpl implements IScheme {
    private readonly _rootAlias: IAlias;
    private readonly _aliases: ReadonlyArray<IAlias>;
    private readonly _enums: ReadonlyArray<IEnum>;
    private readonly _nodes: ReadonlyArray<INodeDefinition>;

    constructor(
        rootAlias: IAlias,
        aliases: ReadonlyArray<IAlias>,
        enums: ReadonlyArray<IEnum>,
        nodes: ReadonlyArray<INodeDefinition>) {

        // Verify that root-alias exists in the aliases array.
        if (!aliases.some(a => a === rootAlias)) {
            throw new Error("RootAlias must exist in aliases array");
        }
        // Verify that there are no duplicate alias/enum identifiers.
        if (Utils.hasDuplicates(aliases.map(a => a.identifier).concat(enums.map(e => e.identifier)))) {
            throw new Error("Alias/Enum identifiers must be unique");
        }
        // Verify that there are no duplicate nodes.
        if (Utils.hasDuplicates(nodes.map(a => a.nodeType))) {
            throw new Error("Nodetype must be unique");
        }

        // Verify that aliases only reference nodes that actually exist.
        if (aliases.length > 0) {
            aliases.map(a => a.values).reduce((a, b) => a.concat(b)).forEach(aliasVal => {
                if (!nodes.some(nodeDef => nodeDef.nodeType === aliasVal)) {
                    throw new Error(`Alias defines a value '${aliasVal}' that is not a type in the types array`);
                }
            });
        }

        this._rootAlias = rootAlias;
        this._aliases = aliases;
        this._enums = enums;
        this._nodes = nodes;
    }

    get rootAlias(): IAlias {
        return this._rootAlias;
    }

    get aliases(): ReadonlyArray<IAlias> {
        return this._aliases;
    }

    get enums(): ReadonlyArray<IEnum> {
        return this._enums;
    }

    get nodes(): ReadonlyArray<INodeDefinition> {
        return this._nodes;
    }

    public getAlias(identifier: string): IAlias | undefined {
        const alias = Utils.find(this._aliases, a => a.identifier === identifier);
        return alias === undefined ? undefined : alias;
    }

    public getEnum(identifier: string): IEnum | undefined {
        const enumEntry = Utils.find(this._enums, e => e.identifier === identifier);
        return enumEntry === undefined ? undefined : enumEntry;
    }

    public getNode(nodeType: string): INodeDefinition | undefined {
        return Utils.find(this._nodes, a => a.nodeType === nodeType);
    }
}

class AliasImpl implements IAlias {
    private readonly _identifier: string;
    private readonly _values: ReadonlyArray<Tree.NodeType>;

    constructor(identifier: string, values: ReadonlyArray<Tree.NodeType>) {
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

    get type(): "alias" {
        return "alias";
    }

    get identifier(): string {
        return this._identifier;
    }

    get values(): ReadonlyArray<Tree.NodeType> {
        return this._values;
    }

    public containsValue(nodeType: Tree.NodeType): boolean {
        return this._values.indexOf(nodeType) >= 0;
    }
}

class EnumImpl implements IEnum {
    private readonly _identifier: string;
    private readonly _values: ReadonlyArray<IEnumEntry>;

    constructor(identifier: string, values: ReadonlyArray<IEnumEntry>) {
        // Verify that this enum has a identifier
        if (identifier === "") {
            throw new Error("Enum must have a identifier");
        }
        // Verify that the values at least contain 1 entry and no duplicates
        if (values.length === 0) {
            throw new Error("Enum must have at least one value");
        }
        if (Utils.hasDuplicates(values.map(entry => entry.value))) {
            throw new Error("Enum values must be unique");
        }

        this._identifier = identifier;
        this._values = values;
    }

    get type(): "enum" {
        return "enum";
    }

    get identifier(): string {
        return this._identifier;
    }

    get values(): ReadonlyArray<IEnumEntry> {
        return this._values;
    }

    public getName(value: number): string | undefined {
        const index = this._values.findIndex(entry => entry.value === value);
        if (index < 0) {
            return undefined;
        }
        return this._values[index].name;
    }
}

class NodeDefinitionImpl implements INodeDefinition {
    private readonly _nodeType: Tree.NodeType;
    private readonly _comment: string | undefined;
    private readonly _fields: ReadonlyArray<IFieldDefinition>;

    constructor(nodeType: Tree.NodeType, comment: string | undefined, fields: ReadonlyArray<IFieldDefinition>) {
        // Verify that this nodescheme has a nodetype
        if (nodeType === "") {
            throw new Error("NodeDefinition must have an type");
        }
        // Verify that all fields have unique names
        if (Utils.hasDuplicates(fields)) {
            throw new Error("Field names must be unique");
        }

        this._nodeType = nodeType;
        this._comment = comment;
        this._fields = fields;
    }

    get comment(): string | undefined {
        return this._comment;
    }

    get nodeType(): string {
        return this._nodeType;
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
    private _enums: IEnum[];
    private _nodes: INodeDefinition[];
    private _build: boolean;

    constructor(rootAliasIdentifier: string) {
        this._rootAliasIdentifier = rootAliasIdentifier;
        this._aliases = [];
        this._enums = [];
        this._nodes = [];
    }

    public pushAlias(identifier: string, values: ReadonlyArray<Tree.NodeType>): IAlias | undefined {
        // New content cannot be pushed after building the scheme
        if (this._build) {
            return undefined;
        }

        // Aliases/Enums have to unique
        if (this._aliases.some(existingAlias => existingAlias.identifier === identifier) ||
            this._enums.some(existingEnum => existingEnum.identifier === identifier)) {
            return undefined;
        }

        try {
            const alias = new AliasImpl(identifier, values);
            this._aliases.push(alias);
            return alias;
        }
        catch (e) {
            if (e instanceof Error) {
                throw Error(`Invalid alias '${identifier}': ${e.message}`);
            } else {
                throw e;
            }
        }
    }

    public pushEnum(identifier: string, values: ReadonlyArray<IEnumEntry>): IEnum | undefined {
        // New content cannot be pushed after building the scheme
        if (this._build) {
            return undefined;
        }

        // Aliases/Enums have to unique
        if (this._enums.some(existingEnum => existingEnum.identifier === identifier) ||
            this._aliases.some(existingAlias => existingAlias.identifier === identifier)) {
            return undefined;
        }

        try {
            const enumEntry = new EnumImpl(identifier, values);
            this._enums.push(enumEntry);
            return enumEntry;
        }
        catch (e) {
            if (e instanceof Error) {
                throw Error(`Invalid enum '${identifier}': ${e.message}`);
            } else {
                throw e;
            }
        }
    }

    public getAlias(identifier: string): IAlias | undefined {
        return Utils.find(this._aliases, a => a.identifier === identifier);
    }

    public getEnum(identifier: string): IEnum | undefined {
        return Utils.find(this._enums, e => e.identifier === identifier);
    }

    public getAliasOrEnum(identifier: string): IAlias | IEnum | undefined {
        const alias = this.getAlias(identifier);
        if (alias !== undefined) {
            return alias;
        }
        return this.getEnum(identifier);
    }

    public pushNodeDefinition(
        nodeType: Tree.NodeType,
        callback?: (builder: INodeDefinitionBuilder) => void): boolean {

        // New content cannot be pushed after building the scheme
        if (this._build) {
            return false;
        }

        // Node definitions have to unique
        if (this._nodes.some(existingNode => existingNode.nodeType === nodeType)) {
            return false;
        }

        if (callback === undefined) {
            this._nodes.push(new NodeDefinitionImpl(nodeType, undefined, []));
        } else {
            const builder = new NodeDefinitionBuilderImpl(nodeType);
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
        return new SchemeImpl(rootAlias, this._aliases, this._enums, this._nodes);
    }
}

class NodeDefinitionBuilderImpl implements INodeDefinitionBuilder {
    private readonly _nodeType: Tree.NodeType;
    private _comment: string | undefined;
    private _fields: IFieldDefinition[];
    private _build: boolean;

    constructor(nodeType: Tree.NodeType) {
        this._nodeType = nodeType;
        this._fields = [];
    }

    get comment(): string | undefined {
        return this._comment;
    }

    set comment(value: string | undefined) {
        this._comment = value;
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
        return new NodeDefinitionImpl(this._nodeType, this._comment, this._fields);
    }
}
