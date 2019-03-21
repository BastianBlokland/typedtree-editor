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
    Utils.Dom.subscribeToClick("toolbox-toggle", toggleToolbox);
    Utils.Dom.subscribeToClick("focus-button", focusTree);
    Utils.Dom.subscribeToClick("zoomin-button", () => { Display.Tree.zoom(0.1); });
    Utils.Dom.subscribeToClick("zoomout-button", () => { Display.Tree.zoom(-0.1); });
    Utils.Dom.subscribeToClick("undo-button", enqueueUndo);
    Utils.Dom.subscribeToClick("redo-button", enqueueRedo);

    Utils.Dom.subscribeToFileInput("openscheme-file", file => {
        enqueueLoadScheme(file);
        enqueueNewTree();
    });
    Utils.Dom.subscribeToClick("exportscheme-button", enqueueExportScheme);

    Utils.Dom.subscribeToClick("newtree-button", enqueueNewTree);
    Utils.Dom.subscribeToFileInput("opentree-file", enqueueLoadTree);
    Utils.Dom.subscribeToClick("pastetree-button", enqueuePasteTree);
    Utils.Dom.subscribeToClick("exporttree-button", enqueueExportTree);
    Utils.Dom.subscribeToClick("copytree-button", enqueueCopyTreeToClipboard);

    console.log("Started running");

    // Load scheme and tree (either from storage or the example)
    const schemeJson = Utils.Dom.tryGetFromStorage("scheme");
    const schemeParseResult = schemeJson === null ? null : TreeScheme.Parser.parseJson(schemeJson);
    const treeName = Utils.Dom.tryGetFromStorage("treename");
    const treeJson = Utils.Dom.tryGetFromStorage("tree");
    const treeParseResult = treeJson === null ? null : Tree.Parser.parseJson(treeJson);

    if (schemeParseResult !== null && schemeParseResult.kind === "success") {
        console.log("Loaded scheme from storage.");
        setCurrentScheme(schemeParseResult.value);

        if (treeParseResult != null && treeParseResult.kind === "success") {
            console.log("Loaded tree from storage.");
            openTree(treeParseResult.value, treeName === null ? currentTreeName : treeName);
        }
    } else {
        console.log("No scheme found in storage, loading example.");
        enqueueLoadScheme("example.treescheme.json");
        enqueueLoadTree("example.tree.json");
    }

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
let currentTreeName = "unknown.tree.json";

function enqueueLoadScheme(source: string | File): void {
    sequencer.enqueue(async () => {
        const result = await TreeScheme.Parser.load(source);
        if (result.kind === "error") {
            alert(`Failed to load. Error: ${result.errorMessage}`);
        } else {
            console.log("Successfully loaded scheme");
            // Activate scheme
            setCurrentScheme(result.value);
            // Save the scheme in storage
            Utils.Dom.trySaveToStorage("scheme", TreeScheme.Serializer.composeJson(result.value));
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

        console.log("Successfully created new tree");
        treeHistory.push(newRoot);
        updateTree("new.tree.json");
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
            openTree(result.value, name);
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
                openTree(result.value, "pasted.tree.json");
            }
        }
    });
}

function enqueueExportScheme(): void {
    sequencer.enqueue(async () => {
        if (currentScheme !== undefined) {
            const treeJson = TreeScheme.Serializer.composeJson(currentScheme);
            Utils.Dom.saveJsonText(treeJson, "export.treescheme.json"!);
        }
    });
}

function enqueueExportTree(): void {
    sequencer.enqueue(async () => {
        if (treeHistory.current !== undefined) {
            const treeJson = Tree.Serializer.composeJson(treeHistory.current);
            Utils.Dom.saveJsonText(treeJson, currentTreeName!);
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
        }
    });
}

function enqueueUndo(): void {
    sequencer.enqueue(async () => {
        treeHistory.undo();
        updateTree(currentTreeName);
    });
}

function enqueueRedo(): void {
    sequencer.enqueue(async () => {
        treeHistory.redo();
        updateTree(currentTreeName);
    });
}

function setCurrentScheme(scheme: TreeScheme.IScheme): void {
    currentScheme = scheme;
    Display.TreeScheme.setScheme(currentScheme);

    // Loading a new scheme invalidates the current tree
    treeHistory.clear();
    updateTree(currentTreeName);
}

function openTree(tree: Tree.INode, name: string): void {
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
    updateTree(name);
    Display.Tree.focusTree(1);
}

function updateTree(name: string): void {
    if (currentScheme === undefined) {
        throw new Error("Unable to update tree. Error: No scheme loaded");
    }

    Utils.Dom.setText("tree-title", name);
    currentTreeName = name;
    Display.Tree.setTree(currentScheme, treeHistory.current, newTree => {
        sequencer.enqueue(async () => {
            treeHistory.push(newTree);
            updateTree(name);
        });
    });

    // Save the new tree to local-storage
    if (treeHistory.current !== undefined) {
        Utils.Dom.trySaveToStorage("treename", name);
        Utils.Dom.trySaveToStorage("tree", Tree.Serializer.composeJson(treeHistory.current));
    }

    // Update undo / button disabled state
    Utils.Dom.setButtonDisabled("undo-button", !treeHistory.hasUndo);
    Utils.Dom.setButtonDisabled("redo-button", !treeHistory.hasRedo);
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
        const file = event.dataTransfer.files[0];
        if (file.name.includes("scheme")) {
            enqueueLoadScheme(file);
            enqueueNewTree();
        } else {
            enqueueLoadTree(file);
        }
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
        case "e": enqueueExportTree(); break;
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
