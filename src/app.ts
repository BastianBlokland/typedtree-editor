/**
 * @file Responsible for running the main app logic.
 */

import * as Display from "./display";
import * as Tree from "./tree";
import * as TreePack from "./treepack";
import * as TreeScheme from "./treescheme";
import * as Utils from "./utils";

enum Mode {
    Normal,
    Integration, // Import / export controls are hidden, expect to be controlled by extern code.
}

/** Function to run the main app logic in. */
export async function run(searchParams: URLSearchParams): Promise<void> {
    mode = searchParams.get("mode") === "integration" ? Mode.Integration : Mode.Normal;

    // Load persistent settings.
    const zoomspeed = Utils.Dom.tryGetFromStorage("zoomspeed");
    if (zoomspeed !== null) {
        setZoomSpeed(parseFloat(zoomspeed));
    }

    // Subscribe to navigation controls.
    window.onkeydown = onDomKeyPress;
    Utils.Dom.subscribeToClick("focus-button", focusTree);
    Utils.Dom.subscribeToClick("zoomin-button", () => { Display.Tree.zoom(0.1); });
    Utils.Dom.subscribeToClick("zoomout-button", () => { Display.Tree.zoom(-0.1); });
    Utils.Dom.subscribeRangeInput("zoomspeed-slider", setZoomSpeed);
    Utils.Dom.subscribeToClick("undo-button", enqueueUndo);
    Utils.Dom.subscribeToClick("redo-button", enqueueRedo);

    switch (mode) {
        case Mode.Normal:

            // Load files when dropped on window.
            window.ondragenter = onDrag;
            window.ondragover = onDrag;
            window.ondragleave = onDrag;
            window.ondrop = onDrag;

            Utils.Dom.subscribeToClick("share-button", enqueueShareToClipboard);
            Utils.Dom.subscribeToClick("toolbox-toggle", toggleToolbox);

            // Subscribe to controls on the toolbox.
            Utils.Dom.subscribeToFileInput("openscheme-file", file => {
                enqueueLoadSchemeFromUrlOrFile(file);
                enqueueEnsureTree();
            });
            Utils.Dom.subscribeToClick("exportscheme-button", enqueueExportScheme);

            Utils.Dom.subscribeToClick("newtree-button", enqueueNewTree);
            Utils.Dom.subscribeToFileInput("opentree-file", enqueueLoadTreeFromUrlOrFile);
            Utils.Dom.subscribeToClick("pastetree-button", enqueuePasteTree);
            Utils.Dom.subscribeToClick("exporttree-button", enqueueExportTree);
            Utils.Dom.subscribeToClick("copytree-button", enqueueCopyTreeToClipboard);

            Utils.Dom.subscribeToFileInput("openpack-file", enqueueLoadPackFromUrlOrFile);
            Utils.Dom.subscribeToClick("exportpack-button", enqueueExportPack);
            break;

        case Mode.Integration:

            // Hide control elements.
            Utils.Dom.hideElementById("toolbox");
            Utils.Dom.hideElementById("toolbox-toggle");
            Utils.Dom.hideElementById("share-button");
            Utils.Dom.hideElementById("github-button");

            // Disable undo / redo until a tree has been loaded.
            Utils.Dom.setButtonDisabled("undo-button", true);
            Utils.Dom.setButtonDisabled("redo-button", true);

            break;
    }

    function getSchemeFromParam(): TreeScheme.IScheme | null {
        const paramValue = searchParams.get("scheme");
        if (paramValue !== null) {
            const json = Utils.Compressor.decompressFromUriComponent(paramValue);
            const parseResult = TreeScheme.Parser.parseJson(json);
            if (parseResult.kind === "success") {
                return parseResult.value;
            } else {
                alert(`Unable to parse scheme from url-arg: ${parseResult.errorMessage}`);
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
            } else {
                alert(`Unable to parse tree from url-arg: ${parseResult.errorMessage}`);
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

    // In 'normal' mode load a scheme and tree from either url params or storage, in 'integration'
    // mode we do not load anything as we expect to be controlled remotely.
    switch (mode) {
        case Mode.Normal:
            console.log("Started running in normal mode");

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
                enqueueLoadSchemeFromUrlOrFile("example.treescheme.json");
                enqueueLoadTreeFromUrlOrFile("example.tree.json");
            }
            break;

        case Mode.Integration:
            console.log("Started running in integration mode");
            break;

    }

    await sequencer.untilEnd;
    console.log("Stopped running");
}

/** Return a json export of the currently loaded scheme. */
export function getCurrentSchemeJson(): string | undefined {
    return currentScheme === undefined ? undefined : TreeScheme.Serializer.composeJson(currentScheme);
}

/** Return a json export of the currently loaded tree. */
export function getCurrentTreeJson(): string | undefined {
    return treeHistory.current === undefined ? undefined : Tree.Serializer.composeJson(treeHistory.current);
}

/** Return a json export of the currently loaded scheme and tree. */
export function getCurrentPackJson(): string | undefined {
    if (currentScheme === undefined || treeHistory.current === undefined) {
        return undefined;
    }
    const pack = TreePack.createPack(currentScheme, treeHistory.current);
    return TreePack.Serializer.composeJson(pack);
}

/** Share url that contains the current loaded scheme and tree. */
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

/** Load a scheme from a json string. */
export function enqueueLoadScheme(json: string): void {
    sequencer.enqueue(async () => {
        const result = TreeScheme.Parser.parseJson(json);
        if (result.kind === "error") {
            alert(`Failed to load. Error: ${result.errorMessage}`);
        } else {
            console.log("Successfully loaded scheme");
            setCurrentScheme(result.value);
        }
    });
}

/** Load a scheme from a (remote) url or a file. */
export function enqueueLoadSchemeFromUrlOrFile(source: string | File): void {
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

/** Create a new tree if non is loaded. */
export function enqueueEnsureTree(): void {
    sequencer.enqueue(async () => {
        if (treeHistory.current === undefined) {
            enqueueNewTree();
        }
    });
}

/** Create a new tree. */
export function enqueueNewTree(): void {
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

/** Load a tree from a json string. */
export function enqueueLoadTree(json: string, name: string, focusTree = true): void {
    sequencer.enqueue(async () => {
        if (currentScheme === undefined) {
            alert("Failed to load a tree. Error: No scheme loaded");
            return;
        }

        const result = Tree.Parser.parseJson(json);
        if (result.kind === "error") {
            alert(`Failed to load. Error: ${result.errorMessage}`);
        } else {
            console.log("Successfully loaded tree");
            openTree(result.value, name, focusTree);
        }
    });
}

/** Load a tree from a (remote) url or a file. */
export function enqueueLoadTreeFromUrlOrFile(source: string | File, focusTree = true): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer.enqueue(async () => {
        if (currentScheme === undefined) {
            alert("Failed to load a tree. Error: No scheme loaded");
            return;
        }

        // Download and parse the tree from the given source.
        const result = await Tree.Parser.load(source);
        if (result.kind === "error") {
            alert(`Failed to parse tree. Error: ${result.errorMessage}`);
        } else {
            openTree(result.value, name, focusTree);
        }
    });
}

/** Copy the currently loaded tree to clipboard. */
export function enqueueCopyTreeToClipboard(): void {
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

/** Paste a tree from clipboard. */
export function enqueuePasteTree(): void {
    sequencer.enqueue(async () => {
        if (currentScheme === undefined) {
            alert("Failed to paste tree. Error: No scheme loaded");
            return;
        }

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

/** Load a pack containing both a scheme and a tree. */
export function enqueueLoadPackFromUrlOrFile(source: string | File): void {
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

/** 'Download' currently loaded scheme. */
export function enqueueExportScheme(): void {
    sequencer.enqueue(async () => {
        if (currentScheme !== undefined) {
            const treeJson = TreeScheme.Serializer.composeJson(currentScheme);
            Utils.Dom.saveJsonText(treeJson, "export.treescheme.json"!);
        }
    });
}

/** 'Download' currently loaded tree. */
export function enqueueExportTree(): void {
    sequencer.enqueue(async () => {
        if (treeHistory.current !== undefined) {
            const treeJson = Tree.Serializer.composeJson(treeHistory.current);
            Utils.Dom.saveJsonText(treeJson, currentTreeName!);
        }
    });
}

/** 'Download' a pack containing both the currently loaded scheme and tree. */
export function enqueueExportPack(): void {
    sequencer.enqueue(async () => {
        if (currentScheme !== undefined && treeHistory.current !== undefined) {
            const pack = TreePack.createPack(currentScheme, treeHistory.current);
            const packJson = TreePack.Serializer.composeJson(pack);
            Utils.Dom.saveJsonText(packJson, "export.treepack.json"!);
        }
    });
}

/** Copy a share link (containing compressed scheme and tree) to clipboard. */
export function enqueueShareToClipboard(): void {
    sequencer.enqueue(async () => {
        const shareUrl = getShareUrl();
        try {
            await Utils.Dom.writeClipboardText(shareUrl);
        } catch (e) {
            alert(`Unable to share: ${e}`);
        }
    });
}

/** Undo the last tree modification. */
export function enqueueUndo(): void {
    sequencer.enqueue(async () => {
        if (currentScheme !== undefined) {
            treeHistory.undo();
            updateTree(currentTreeName);
        }
    });
}

/** Redo the last tree modification. */
export function enqueueRedo(): void {
    sequencer.enqueue(async () => {
        if (currentScheme !== undefined) {
            treeHistory.redo();
            updateTree(currentTreeName);
        }
    });
}

const sequencer = Utils.Sequencer.createRunner();

const maxTreeHistory: number = 100;
const treeHistory: Utils.History.IHistoryStack<Tree.INode> = Utils.History.createHistoryStack(maxTreeHistory);

let mode: Mode;
let currentScheme: TreeScheme.IScheme | undefined;
let currentTreeName = "unknown.tree.json";

function setCurrentScheme(scheme: TreeScheme.IScheme): void {
    currentScheme = scheme;
    Display.TreeScheme.setScheme(currentScheme);

    // Save the scheme in storage
    if (mode !== Mode.Integration) {
        Utils.Dom.trySaveToStorage("scheme", TreeScheme.Serializer.composeJson(scheme));
    }

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

function openTree(tree: Tree.INode, name: string, focusTree = true): void {
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

    if (focusTree) {
        Display.Tree.focusTree(1);
    }
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
    if (treeHistory.current !== undefined && mode !== Mode.Integration) {
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
            enqueueLoadPackFromUrlOrFile(file);
        } else if (file.name.includes("scheme")) {
            enqueueLoadSchemeFromUrlOrFile(file);
            enqueueEnsureTree();
        } else {
            enqueueLoadTreeFromUrlOrFile(file);
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
        case "t":
            if (mode === Mode.Normal) {
                toggleToolbox();
            }
            break;
        case "f": focusTree(); break;
        case "e":
            if (mode === Mode.Normal) {
                enqueueExportTree();
            }
            break;
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
