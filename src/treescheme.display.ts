/**
 * @file Responsible for displaying tree-scheme's as dom elements.
 */

import * as DomUtils from "./domutils";
import * as TreeScheme from "./treescheme";

/** Initialize the display, needs to be done once. */
export function initialize(): void {
    if (schemeDisplayElement != null)
        throw new Error("Already initialized");

    const displayElem = document.getElementById(schemeDisplayElementId);
    if (displayElem === null)
        throw new Error(`No dom element found with id: ${schemeDisplayElementId}`);
    schemeDisplayElement = displayElem;
}

export function setScheme(scheme: TreeScheme.Scheme): void {
    assertInitialized();
    DomUtils.clearChildren(schemeDisplayElement!);

    const content = DomUtils.createWithChildren("div",
        DomUtils.createWithChildren("div",
            DomUtils.createWithText("span", "Root: ", "header"),
            DomUtils.createWithText("span", scheme.rootAlias.identifier, "identifier")),
        DomUtils.createWithText("span", "Aliases: ", "header"),
        DomUtils.createUList(...scheme.aliases.map(createAliasElement)),
        DomUtils.createWithText("span", "Nodes: ", "header"),
        DomUtils.createUList(...scheme.nodes.map(createNodeElement)));

    schemeDisplayElement!.appendChild(content);
}

const schemeDisplayElementId = "scheme-display";
let schemeDisplayElement: HTMLElement | undefined;

function createAliasElement(alias: TreeScheme.Alias): HTMLElement {
    return DomUtils.createWithChildren("details",
        DomUtils.createSummary(alias.identifier, "identifier"),
        DomUtils.createUList(...alias.values.map(f => DomUtils.createWithText("span", f, "identifier"))));
}

function createNodeElement(nodeDefinition: TreeScheme.NodeDefinition): HTMLElement {
    if (nodeDefinition.fields.length == 0) {
        return DomUtils.createWithText("span", nodeDefinition.identifier, "identifier");
    }
    return DomUtils.createWithChildren("details",
        DomUtils.createSummary(nodeDefinition.identifier, "identifier"),
        DomUtils.createUList(...nodeDefinition.fields.map(f =>
            DomUtils.createWithChildren("div",
                DomUtils.createWithText("span",
                    f.name, "identifier"),
                DomUtils.createWithText("span",
                    TreeScheme.getPrettyFieldValueType(f.valueType, f.isArray), "field-type")))));
}

function assertInitialized(): void {
    if (schemeDisplayElement === undefined)
        throw new Error("Display hasn't been initialized");
}
