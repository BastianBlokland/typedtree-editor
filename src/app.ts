/**
 * @file Responsible for running the main app logic.
 */

import * as Tree from "./tree";
import * as TreeDisplay from "./tree.display";
import * as TreeScheme from "./treescheme";
import * as TreeSchemeDisplay from "./treescheme.display";
import * as TreeSchemeInstantiator from "./treescheme.instantiator";
import * as TreeSchemeParser from "./treescheme.parser";
import * as TreeSchemeSerializer from "./treescheme.serializer";
import * as TreeSchemeValidator from "./treescheme.validator";
import * as Utils from "./utils";

/** Function to run the main app logic in. */
export async function run(): Promise<void> {
    sequencer = Utils.Sequencer.createRunner();

    window.onkeydown = onDomKeyPress;
    Utils.Dom.subscribeToClick("toolbox-toggle", toggleToolbox);
    Utils.Dom.subscribeToClick("focus-button", focusTree);
    Utils.Dom.subscribeToClick("zoomin-button", () => { TreeDisplay.zoom(0.1); });
    Utils.Dom.subscribeToClick("zoomout-button", () => { TreeDisplay.zoom(-0.1); });

    Utils.Dom.subscribeToFileInput("openscheme-file", enqueueLoadScheme);
    Utils.Dom.subscribeToClick("savescheme-button", enqueueSaveScheme);

    Utils.Dom.subscribeToClick("newtree-button", enqueueNewTree);
    Utils.Dom.subscribeToFileInput("opentree-file", enqueueLoadTree);
    Utils.Dom.subscribeToClick("savetree-button", enqueueSaveTree);

    console.log("Started running");

    console.log("Start loading example scheme and tree");
    enqueueLoadScheme("example.treescheme.json");
    enqueueLoadTree("example.tree.json");

    await sequencer.untilEnd;
    console.log("Stopped running");
}

/** Return a json export of the currently loaded scheme. Useful for interop with other JavaScript. */
export function getCurrentSchemeJson(): string | undefined {
    return currentScheme === undefined ? undefined : TreeSchemeSerializer.composeJson(currentScheme);
}

/** Return a json export of the currently loaded tree. Useful for interop with other JavaScript. */
export function getCurrentTreeJson(): string | undefined {
    return currentTree === undefined ? undefined : Tree.Serializer.composeJson(currentTree);
}

let sequencer: Utils.Sequencer.ISequenceRunner | undefined;

let currentScheme: TreeScheme.IScheme | undefined;
let currentSchemeName: string | undefined;

let currentTree: Tree.INode | undefined;
let currentTreeName: string | undefined;

function enqueueLoadScheme(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer!.enqueue(async () => {
        const result = await TreeSchemeParser.load(source);
        if (result.kind === "error") {
            alert(`Failed to load. Error: ${result.errorMessage}`);
        } else {
            console.log(`Successfully loaded scheme: ${name}`);
            setCurrentScheme(result.value, name);
        }
    });
}

function enqueueNewTree(): void {
    sequencer!.enqueue(async () => {
        if (currentScheme === undefined) {
            alert("Failed to create a new tree. Error: No scheme loaded");
            return;
        }
        const defaultRoot = TreeScheme.getDefaultDefinition(currentScheme, currentScheme.rootAlias);
        const newRoot = TreeSchemeInstantiator.instantiateDefaultNode(defaultRoot);

        console.log(`Successfully created new tree. Scheme: ${currentSchemeName}`);
        setCurrentTree(newRoot, "New tree");
        TreeDisplay.focusTree(1);
    });
}

function enqueueLoadTree(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer!.enqueue(async () => {
        // Start by clearing the current loaded tree.
        setCurrentTree(undefined, undefined);

        // Download and pars the tree from the given source.
        const result = await Tree.Parser.load(source);
        if (result.kind === "error") {
            alert(`Failed to parse tree. Error: ${result.errorMessage}`);
        } else {
            if (currentScheme === undefined) {
                alert("Failed to load tree. Error: No scheme loaded");
                return;
            }
            // Validated the parsed tree against the current scheme.
            const validateResult = TreeSchemeValidator.validate(currentScheme, result.value);
            if (validateResult !== true) {
                alert(`Failed to validate tree. Error: ${validateResult.errorMessage}`);
                return;
            }
            const completeTree = TreeSchemeInstantiator.duplicateWithMissingFields(currentScheme, result.value);

            console.log(`Successfully loaded tree: ${name}`);
            setCurrentTree(completeTree, name);
            TreeDisplay.focusTree(1);
        }
    });
}

function enqueueSaveScheme(): void {
    sequencer!.enqueue(async () => {
        if (currentScheme !== undefined) {
            const treeJson = TreeSchemeSerializer.composeJson(currentScheme);
            Utils.Dom.saveJsonText(treeJson, currentSchemeName!);
        }
    });
}

function enqueueSaveTree(): void {
    sequencer!.enqueue(async () => {
        if (currentTree !== undefined) {
            const treeJson = Tree.Serializer.composeJson(currentTree);
            Utils.Dom.saveJsonText(treeJson, currentTreeName!);
        }
    });
}

function enqueueUpdateTree(oldTree: Tree.INode, newTree?: Tree.INode, name?: string): void {
    sequencer!.enqueue(async () => {
        if (oldTree === currentTree) {
            setCurrentTree(newTree, name);
        }
    });
}

function setCurrentScheme(scheme: TreeScheme.IScheme, name: string): void {
    currentScheme = scheme;
    currentSchemeName = name;
    TreeSchemeDisplay.setScheme(currentScheme);

    // Loading a new scheme invalidates the current tree. (In theory we could support checking if the
    // previously loaded tree is still compatible with the new scheme)
    setCurrentTree(undefined, undefined);
}

function setCurrentTree(tree: Tree.INode | undefined, name?: string): void {
    if (currentScheme === undefined) {
        throw new Error("Unable to update tree. Error: No scheme loaded");
    }

    currentTree = tree;
    currentTreeName = name;
    Utils.Dom.setText("tree-title", name === undefined ? "" : name);
    TreeDisplay.setTree(currentScheme, tree, newTree => {
        if (tree !== undefined) {
            enqueueUpdateTree(tree, newTree, name);
        }
    });
}

function toggleToolbox(): void {
    const toolbox = document.getElementById("toolbox");
    if (toolbox === null) {
        throw new Error("Unable to find 'toolbox'");
    }
    if (toolbox.style.visibility === "hidden") {
        toolbox.style.visibility = "visible";
    } else {
        toolbox.style.visibility = "hidden";
    }
}

function focusTree(): void {
    if (currentTree !== undefined) {
        TreeDisplay.focusTree(2);
    }
}

function onDomKeyPress(event: KeyboardEvent): void {
    if (Utils.Dom.isInputFocussed()) {
        return;
    }
    switch (event.key) {
        case "t": toggleToolbox(); break;
        case "f": focusTree(); break;
        case "+": case "=": TreeDisplay.zoom(0.1); break;
        case "-": case "_": TreeDisplay.zoom(-0.1); break;
    }
}
