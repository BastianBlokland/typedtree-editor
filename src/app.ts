/**
 * @file Responsible for running the main app logic.
 */

import * as Display from "./display";
import * as Tree from "./tree";
import * as TreeScheme from "./treescheme";
import * as Utils from "./utils";

/** Function to run the main app logic in. */
export async function run(): Promise<void> {
    window.ondragenter = onDrag;
    window.ondragover = onDrag;
    window.ondragleave = onDrag;
    window.ondrop = onDrag;
    window.onkeydown = onDomKeyPress;
    window.onbeforeunload = onBeforeUnload;
    Utils.Dom.subscribeToClick("toolbox-toggle", toggleToolbox);
    Utils.Dom.subscribeToClick("focus-button", focusTree);
    Utils.Dom.subscribeToClick("zoomin-button", () => { Display.Tree.zoom(0.1); });
    Utils.Dom.subscribeToClick("zoomout-button", () => { Display.Tree.zoom(-0.1); });
    Utils.Dom.subscribeToClick("undo-button", enqueueUndo);
    Utils.Dom.subscribeToClick("redo-button", enqueueRedo);

    Utils.Dom.subscribeToFileInput("openscheme-file", enqueueLoadScheme);
    Utils.Dom.subscribeToClick("savescheme-button", enqueueSaveScheme);

    Utils.Dom.subscribeToClick("newtree-button", enqueueNewTree);
    Utils.Dom.subscribeToFileInput("opentree-file", enqueueLoadTree);
    Utils.Dom.subscribeToClick("pastetree-button", enqueuePasteTree);
    Utils.Dom.subscribeToClick("savetree-button", enqueueSaveTree);
    Utils.Dom.subscribeToClick("copytree-button", enqueueCopyTreeToClipboard);

    console.log("Started running");

    console.log("Start loading example scheme and tree");
    enqueueLoadScheme("example.treescheme.json");
    enqueueLoadTree("example.tree.json");

    await sequencer.untilEnd;
    console.log("Stopped running");
}

/** Return a json export of the currently loaded scheme. Useful for interop with other JavaScript. */
export function getCurrentSchemeJson(): string | undefined {
    return currentScheme === undefined ? undefined : TreeScheme.Serializer.composeJson(currentScheme);
}

/** Return a json export of the currently loaded tree. Useful for interop with other JavaScript. */
export function getCurrentTreeJson(): string | undefined {
    return treeHistory.current === undefined ? undefined : Tree.Serializer.composeJson(treeHistory.current);
}

const sequencer = Utils.Sequencer.createRunner();

const maxTreeHistory: number = 100;
const treeHistory: Utils.History.IHistoryStack<Tree.INode> = Utils.History.createHistoryStack(maxTreeHistory);

let currentScheme: TreeScheme.IScheme | undefined;
let currentSchemeName: string | undefined;
let currentTreeName: string | undefined;
let hasUnsavedChanges: boolean = false;

function enqueueLoadScheme(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer.enqueue(async () => {
        const result = await TreeScheme.Parser.load(source);
        if (result.kind === "error") {
            alert(`Failed to load. Error: ${result.errorMessage}`);
        } else {
            console.log(`Successfully loaded scheme: ${name}`);
            setCurrentScheme(result.value, name);
        }
    });
}

function enqueueNewTree(): void {
    sequencer.enqueue(async () => {
        if (currentScheme === undefined) {
            alert("Failed to create a new tree. Error: No scheme loaded");
            return;
        }
        const defaultRoot = TreeScheme.getDefaultDefinition(currentScheme, currentScheme.rootAlias);
        const newRoot = TreeScheme.Instantiator.instantiateDefaultNode(defaultRoot);

        console.log(`Successfully created new tree. Scheme: ${currentSchemeName}`);
        treeHistory.push(newRoot);
        hasUnsavedChanges = false;
        currentTreeName = "new.tree.json";
        updateTree();
        Display.Tree.focusTree(1);
    });
}

function enqueueLoadTree(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer.enqueue(async () => {
        // Download and pars the tree from the given source.
        const result = await Tree.Parser.load(source);
        if (result.kind === "error") {
            alert(`Failed to parse tree. Error: ${result.errorMessage}`);
        } else {
            currentTreeName = name;
            openTree(result.value);
        }
    });
}

function enqueuePasteTree(): void {
    sequencer.enqueue(async () => {
        let json: string | undefined;
        try {
            json = await Utils.Dom.readClipboardText();
        } catch (e) {
            alert(`Unable to paste: ${e}`);
        }
        if (json !== undefined) {
            const result = await Tree.Parser.parseJson(json);
            if (result.kind === "error") {
                alert(`Failed to parse tree. Error: ${result.errorMessage}`);
            } else {
                currentTreeName = "pasted.tree.json";
                openTree(result.value);
            }
        }
    });
}

function enqueueSaveScheme(): void {
    sequencer.enqueue(async () => {
        if (currentScheme !== undefined) {
            const treeJson = TreeScheme.Serializer.composeJson(currentScheme);
            Utils.Dom.saveJsonText(treeJson, currentSchemeName!);
        }
    });
}

function enqueueSaveTree(): void {
    sequencer.enqueue(async () => {
        if (treeHistory.current !== undefined) {
            const treeJson = Tree.Serializer.composeJson(treeHistory.current);
            Utils.Dom.saveJsonText(treeJson, currentTreeName!);
            hasUnsavedChanges = false;
            updateTreeTitle();
        }
    });
}

function enqueueCopyTreeToClipboard(): void {
    sequencer.enqueue(async () => {
        if (treeHistory.current !== undefined) {
            const treeJson = Tree.Serializer.composeJson(treeHistory.current);
            try {
                await Utils.Dom.writeClipboardText(treeJson);
            } catch (e) {
                alert(`Unable to copy: ${e}`);
            }
            hasUnsavedChanges = false;
            updateTreeTitle();
        }
    });
}

function enqueueUndo(): void {
    sequencer.enqueue(async () => {
        treeHistory.undo();
        updateTree();
    });
}

function enqueueRedo(): void {
    sequencer.enqueue(async () => {
        treeHistory.redo();
        updateTree();
    });
}

function setCurrentScheme(scheme: TreeScheme.IScheme, name: string): void {
    currentScheme = scheme;
    currentSchemeName = name;
    Display.TreeScheme.setScheme(currentScheme);

    // Loading a new scheme invalidates the current tree. (In theory we could support checking if the
    // previously loaded tree is still compatible with the new scheme)
    treeHistory.clear();
    currentTreeName = undefined;
    updateTree();
}

function openTree(tree: Tree.INode): void {
    if (currentScheme === undefined) {
        alert("Failed to open tree. Error: No scheme loaded");
        return;
    }
    // Validated the tree against the current scheme.
    const validateResult = TreeScheme.Validator.validate(currentScheme, tree);
    if (validateResult !== true) {
        alert(`Failed to validate tree. Error: ${validateResult.errorMessage}`);
        return;
    }
    const completeTree = TreeScheme.Instantiator.duplicateWithMissingFields(currentScheme, tree);

    treeHistory.push(completeTree);
    hasUnsavedChanges = false;
    updateTree();
    Display.Tree.focusTree(1);
}

function updateTree(): void {
    if (currentScheme === undefined) {
        throw new Error("Unable to update tree. Error: No scheme loaded");
    }

    updateTreeTitle();
    Display.Tree.setTree(currentScheme, treeHistory.current, newTree => {
        sequencer.enqueue(async () => {
            treeHistory.push(newTree);
            hasUnsavedChanges = true;
            updateTree();
        });
    });

    // Update undo / button disabled state
    Utils.Dom.setButtonDisabled("undo-button", !treeHistory.hasUndo);
    Utils.Dom.setButtonDisabled("redo-button", !treeHistory.hasRedo);
}

function updateTreeTitle(): void {
    Utils.Dom.setText("tree-title",
        (currentTreeName === undefined ? "" : currentTreeName) +
        (hasUnsavedChanges ? " 🔴" : ""));
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
    if (treeHistory.current !== undefined) {
        Display.Tree.focusTree(2);
    }
}

function onDrag(event: DragEvent): void {
    // If a file was dropped then load it as a tree.
    if (event.dataTransfer !== null && event.dataTransfer.files !== null && event.dataTransfer.files.length) {
        // Note: It would actually be possible to conditionally load a tree or a scheme based on a file
        // naming convention, need to give it some more thought wether or not thats a good idea.
        enqueueLoadTree(event.dataTransfer.files[0]);
    }

    // Prevent default drag and drop behaviour
    event.preventDefault();
    event.stopPropagation();
}

function onDomKeyPress(event: KeyboardEvent): void {
    if (Utils.Dom.isInputFocussed()) {
        return;
    }
    switch (event.key) {
        case "t": toggleToolbox(); break;
        case "f": focusTree(); break;
        case "s": enqueueSaveTree(); break;
        case "c": enqueueCopyTreeToClipboard(); break;
        case "v": enqueuePasteTree(); break;
        case "+": case "=": Display.Tree.zoom(0.1); break;
        case "-": case "_": Display.Tree.zoom(-0.1); break;
        case "z":
            if (event.shiftKey) {
                enqueueRedo();
            } else {
                enqueueUndo();
            }
            break;
        case "Z": enqueueRedo(); break;
    }
}

function onBeforeUnload(): string | undefined {
    if (hasUnsavedChanges) {
        return "Are your sure you want to quit without saving?";
    }
    return undefined;
}
