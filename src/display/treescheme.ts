/**
 * @file Responsible for displaying tree-scheme's as dom elements.
 */

import * as TreeScheme from "../treescheme";
import * as Utils from "../utils";

/** Initialize the display, needs to be done once. */
export function initialize(): void {
    if (schemeDisplayElement != null) {
        throw new Error("Already initialized");
    }

    const displayElem = document.getElementById(schemeDisplayElementId);
    if (displayElem === null) {
        throw new Error(`No dom element found with id: ${schemeDisplayElementId}`);
    }
    schemeDisplayElement = displayElem;
}

export function setScheme(scheme: TreeScheme.IScheme): void {
    assertInitialized();
    Utils.Dom.clearChildren(schemeDisplayElement!);

    const content = Utils.Dom.createWithChildren("div",
        Utils.Dom.createWithChildren("div",
            Utils.Dom.createWithText("span", "Root: ", "header"),
            Utils.Dom.createWithText("span", scheme.rootAlias.identifier, "identifier")),
        Utils.Dom.createWithText("span", "Aliases: ", "header"),
        Utils.Dom.createUList(...scheme.aliases.map(createAliasElement)),
        Utils.Dom.createWithText("span", "Nodes: ", "header"),
        Utils.Dom.createUList(...scheme.nodes.map(createNodeElement)));

    schemeDisplayElement!.appendChild(content);
}

const schemeDisplayElementId = "scheme-display";
let schemeDisplayElement: HTMLElement | undefined;

function createAliasElement(alias: TreeScheme.IAlias): HTMLElement {
    return Utils.Dom.createWithChildren("details",
        Utils.Dom.createSummary(alias.identifier, "identifier"),
        Utils.Dom.createUList(...alias.values.map(f => Utils.Dom.createWithText("span", f, "identifier"))));
}

function createNodeElement(nodeDefinition: TreeScheme.INodeDefinition): HTMLElement {
    if (nodeDefinition.fields.length === 0) {
        return Utils.Dom.createWithText("span", nodeDefinition.nodeType, "identifier");
    }
    return Utils.Dom.createWithChildren("details",
        Utils.Dom.createSummary(nodeDefinition.nodeType, "identifier"),
        Utils.Dom.createUList(...nodeDefinition.fields.map(f =>
            Utils.Dom.createWithChildren("div",
                Utils.Dom.createWithText("span",
                    f.name, "identifier"),
                Utils.Dom.createWithText("span",
                    TreeScheme.getPrettyFieldValueType(f.valueType, f.isArray), "field-type")))));
}

function assertInitialized(): void {
    if (schemeDisplayElement === undefined) {
        throw new Error("Display hasn't been initialized");
    }
}
