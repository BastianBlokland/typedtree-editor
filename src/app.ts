/**
 * @file Responsible for running the main app logic.
 */

import * as Display from "./display";
import * as Tree from "./tree";
import * as TreePack from "./treepack";
import * as TreeScheme from "./treescheme";
import * as Utils from "./utils";

/** Function to run the main app logic in. */
export async function run(searchParams: URLSearchParams): Promise<void> {
    window.ondragenter = onDrag;
    window.ondragover = onDrag;
    window.ondragleave = onDrag;
    window.ondrop = onDrag;
    window.onkeydown = onDomKeyPress;
    const zoomspeed = Utils.Dom.tryGetFromStorage("zoomspeed");
    if (zoomspeed !== null) {
        setZoomSpeed(parseFloat(zoomspeed));
    }
    Utils.Dom.subscribeToClick("share-button", enqueueShareToClipboard);
    Utils.Dom.subscribeToClick("toolbox-toggle", toggleToolbox);
    Utils.Dom.subscribeToClick("focus-button", focusTree);
    Utils.Dom.subscribeToClick("zoomin-button", () => { Display.Tree.zoom(0.1); });
    Utils.Dom.subscribeToClick("zoomout-button", () => { Display.Tree.zoom(-0.1); });
    Utils.Dom.subscribeRangeInput("zoomspeed-slider", setZoomSpeed);
    Utils.Dom.subscribeToClick("undo-button", enqueueUndo);
    Utils.Dom.subscribeToClick("redo-button", enqueueRedo);

    Utils.Dom.subscribeToFileInput("openscheme-file", file => {
        enqueueLoadScheme(file);
        enqueueEnsureTree();
    });
    Utils.Dom.subscribeToClick("exportscheme-button", enqueueExportScheme);

    Utils.Dom.subscribeToClick("newtree-button", enqueueNewTree);
    Utils.Dom.subscribeToFileInput("opentree-file", enqueueLoadTree);
    Utils.Dom.subscribeToClick("pastetree-button", enqueuePasteTree);
    Utils.Dom.subscribeToClick("exporttree-button", enqueueExportTree);
    Utils.Dom.subscribeToClick("copytree-button", enqueueCopyTreeToClipboard);

    Utils.Dom.subscribeToFileInput("openpack-file", enqueueLoadPack);
    Utils.Dom.subscribeToClick("exportpack-button", enqueueExportPack);

    console.log("Started running");

    function getSchemeFromParam(): TreeScheme.IScheme | null {
        const paramValue = searchParams.get("scheme");
        if (paramValue !== null) {
            const json = Utils.Compressor.decompressFromUriComponent(paramValue);
            const parseResult = TreeScheme.Parser.parseJson(json);
            if (parseResult.kind === "success") {
                return parseResult.value;
            }
        }
        return null;
    }

    function getTreeFromParam(): { tree: Tree.INode, treename: string } | null {
        const treeParamValue = searchParams.get("tree");
        const treenameParamValue = searchParams.get("treename");
        if (treeParamValue !== null) {
            const json = Utils.Compressor.decompressFromUriComponent(treeParamValue);
            const parseResult = Tree.Parser.parseJson(json);
            if (parseResult.kind === "success") {
                const treename = treenameParamValue == null ?
                    "shared.tree.json" : decodeURIComponent(treenameParamValue);
                return { tree: parseResult.value, treename };
            }
        }
        return null;
    }

    function getSchemeFromStorage(): TreeScheme.IScheme | null {
        const json = Utils.Dom.tryGetFromStorage("scheme");
        if (json !== null) {
            const parseResult = TreeScheme.Parser.parseJson(json);
            if (parseResult.kind === "success") {
                return parseResult.value;
            }
        }
        return null;
    }

    function getTreeFromStorage(): { tree: Tree.INode, treename: string } | null {
        const treeJson = Utils.Dom.tryGetFromStorage("tree");
        let treename = Utils.Dom.tryGetFromStorage("treename");
        if (treename === null) {
            treename = "unknown.tree.json";
        }
        if (treeJson !== null) {
            const treeParseResult = Tree.Parser.parseJson(treeJson);
            if (treeParseResult.kind === "success") {
                return { tree: treeParseResult.value, treename };
            }
        }
        return null;
    }

    // Load scheme. (either from params or storage)
    let scheme = getSchemeFromParam();
    if (scheme !== null) {
        console.log("Loaded scheme from param.");
        setCurrentScheme(scheme);
    } else {
        scheme = getSchemeFromStorage();
        if (scheme !== null) {
            console.log("Loaded scheme from storage.");
            setCurrentScheme(scheme);
        }
    }

    // If we found a scheme then attempt to load a tree. (either from params or storage)
    if (currentScheme !== undefined) {
        let tree = getTreeFromParam();
        if (tree !== null && TreeScheme.Validator.validate(currentScheme, tree.tree) === true) {
            console.log("Loaded tree from param.");
            openTree(tree.tree, tree.treename);
        } else {
            tree = getTreeFromStorage();
            if (tree !== null && TreeScheme.Validator.validate(currentScheme, tree.tree) === true) {
                console.log("Loaded tree from storage.");
                openTree(tree.tree, tree.treename);
            } else {
                console.log("No existing tree found, creating new.");
                enqueueNewTree();
            }
        }
    } else {
        console.log("No existing scheme found, loading example.");
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

/** Return a json export of the currently loaded scheme and tree. Useful for interop with other JavaScript. */
export function getCurrentPackJson(): string | undefined {
    if (currentScheme === undefined || treeHistory.current === undefined) {
        return undefined;
    }
    const pack = TreePack.createPack(currentScheme, treeHistory.current);
    return TreePack.Serializer.composeJson(pack);
}

/** Url that contains the current loaded scheme and tree. Useful for interop with other JavaScript. */
export function getShareUrl(): string {
    const url = new URL("index.html", location.origin + location.pathname);
    if (currentScheme !== undefined) {
        const schemeJson = TreeScheme.Serializer.composeJson(currentScheme, false);
        const schemeUriComp = Utils.Compressor.compressToUriComponent(schemeJson);
        url.searchParams.append("scheme", schemeUriComp);

        if (treeHistory.current !== undefined) {
            const treeJson = Tree.Serializer.composeJson(treeHistory.current, false);
            const treeUriComp = Utils.Compressor.compressToUriComponent(treeJson);
            url.searchParams.append("tree", treeUriComp);
            url.searchParams.append("treename", encodeURIComponent(currentTreeName));
        }
    }
    return url.href;
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
            setCurrentScheme(result.value);
        }
    });
}

function enqueueEnsureTree(): void {
    sequencer.enqueue(async () => {
        if (treeHistory.current === undefined) {
            enqueueNewTree();
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
        // Download and parse the tree from the given source.
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
        if (json !== undefined && json !== "") {
            const result = await Tree.Parser.parseJson(json);
            if (result.kind === "error") {
                alert(`Failed to parse tree. Error: ${result.errorMessage}`);
            } else {
                openTree(result.value, "pasted.tree.json");
            }
        }
    });
}

function enqueueLoadPack(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer.enqueue(async () => {
        // Download and parse the pack from the given source.
        const result = await TreePack.Parser.load(source);
        if (result.kind === "error") {
            alert(`Failed to parse pack. Error: ${result.errorMessage}`);
        } else {
            console.log("Successfully loaded pack");
            setCurrentScheme(result.value.scheme);
            openTree(result.value.tree, name.replace("treepack.json", "tree.json"));
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

function enqueueExportPack(): void {
    sequencer.enqueue(async () => {
        if (currentScheme !== undefined && treeHistory.current !== undefined) {
            const pack = TreePack.createPack(currentScheme, treeHistory.current);
            const packJson = TreePack.Serializer.composeJson(pack);
            Utils.Dom.saveJsonText(packJson, "export.treepack.json"!);
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

function enqueueShareToClipboard(): void {
    sequencer.enqueue(async () => {
        const shareUrl = getShareUrl();
        try {
            await Utils.Dom.writeClipboardText(shareUrl);
        } catch (e) {
            alert(`Unable to share: ${e}`);
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

    // Save the scheme in storage
    Utils.Dom.trySaveToStorage("scheme", TreeScheme.Serializer.composeJson(scheme));

    // Prune the history of tree's that do not match the new scheme.
    treeHistory.prune(historyTree => {
        return TreeScheme.Validator.validate(scheme, historyTree) === true;
    });

    // Migrate all items in the history to the new scheme.
    treeHistory.map(historyTree => {
        return TreeScheme.Instantiator.duplicateWithMissingFields(scheme, historyTree);
    });

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

function setZoomSpeed(newSpeed: number): void {
    Display.Svg.zoomSpeed = newSpeed;
    Utils.Dom.trySaveToStorage("zoomspeed", newSpeed.toString());
    Utils.Dom.setInputValue("zoomspeed-slider", newSpeed.toString());
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
        if (file.name.includes("treepack")) {
            enqueueLoadPack(file);
        } else if (file.name.includes("scheme")) {
            enqueueLoadScheme(file);
            enqueueEnsureTree();
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
