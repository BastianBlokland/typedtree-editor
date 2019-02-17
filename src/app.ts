import * as DomUtils from "./domutils";
import * as Sequencer from "./sequencer";
import * as Tree from "./tree";
import * as TreeParser from "./tree.parser";
import * as TreeSerializer from "./tree.serializer";
import * as TreeDisplay from "./tree.display";
import * as TreeScheme from "./treescheme";
import * as TreeSchemeParser from "./treescheme.parser";
import * as TreeSchemeSerializer from "./treescheme.serializer";
import * as TreeSchemeDisplay from "./treescheme.display";

/** Function to run the main app logic in. */
export async function run(): Promise<void> {
    sequencer = Sequencer.createRunner();

    window.onkeydown = onDomKeyPress;
    DomUtils.subscribeToClick("toolbox-toggle", toggleToolbox);
    DomUtils.subscribeToClick("focus-button", () => {
        if (currentTree !== undefined)
            TreeDisplay.focusTree();
    });

    DomUtils.subscribeToFileInput("openscheme-file", enqueueLoadScheme);
    DomUtils.subscribeToClick("savescheme-button", enqueueSaveScheme);

    DomUtils.subscribeToFileInput("opentree-file", enqueueLoadTree);
    DomUtils.subscribeToClick("savetree-button", enqueueSaveTree);

    console.log("Started running");

    console.log("Start loading example scheme and tree");
    enqueueLoadScheme("example.treescheme.json");
    enqueueLoadTree("example.tree.json");

    await sequencer.untilEnd;
    console.log("Stopped running");
}

let sequencer: Sequencer.SequenceRunner | undefined = undefined;

let currentScheme: TreeScheme.Scheme | undefined = undefined;
let currentSchemeName: string | undefined = undefined;

let currentTree: Tree.Node | undefined = undefined;
let currentTreeName: string | undefined = undefined;

function enqueueLoadScheme(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer!.enqueue(async () => {
        const result = await TreeSchemeParser.load(source);
        if (result.kind === "error")
            alert(`Failed to load. Error: ${result.errorMessage}`);
        else {
            console.log(`Successfully loaded scheme: ${name}`);
            setCurrentScheme(result.value, name);
        }
    });
}

function enqueueLoadTree(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer!.enqueue(async () => {
        if (currentScheme === undefined)
            throw new Error("Unable to load a tree without a scheme being loaded first");

        const result = await TreeParser.load(source);
        if (result.kind === "error")
            alert(`Failed to load. Error: ${result.errorMessage}`);
        else {
            console.log(`Successfully loaded tree: ${name}`);
            setCurrentTree(result.value, name);
            TreeDisplay.focusTree();
        }
    });
}

function enqueueSaveScheme(): void {
    sequencer!.enqueue(async () => {
        if (currentScheme !== undefined) {
            const treeJson = TreeSchemeSerializer.composeJson(currentScheme);
            DomUtils.saveJsonText(treeJson, currentSchemeName!);
        }
    });
}

function enqueueSaveTree(): void {
    sequencer!.enqueue(async () => {
        if (currentTree !== undefined) {
            const treeJson = TreeSerializer.composeJson(currentTree);
            DomUtils.saveJsonText(treeJson, currentTreeName!);
        }
    });
}

function enqueueUpdateTree(oldTree: Tree.Node, newTree?: Tree.Node, name?: string): void {
    sequencer!.enqueue(async () => {
        if (oldTree === currentTree) {
            setCurrentTree(newTree, name);
        }
    });
}

function setCurrentScheme(scheme: TreeScheme.Scheme, name: string): void {
    currentScheme = scheme;
    currentSchemeName = name;
    TreeSchemeDisplay.setScheme(currentScheme);

    // Loading a new scheme invalidates the current tree. (In theory we could support checking if the
    // previously loaded tree is still compatible with the new scheme)
    setCurrentTree(undefined, undefined);
}

function setCurrentTree(tree: Tree.Node | undefined, name?: string): void {
    currentTree = tree;
    currentTreeName = name;
    DomUtils.setText("tree-title", name === undefined ? "" : name);
    TreeDisplay.setTree(tree, newTree => {
        if (tree !== undefined)
            enqueueUpdateTree(tree, newTree, name);
    });
}

function toggleToolbox(): void {
    const toolbox = document.getElementById("toolbox");
    if (toolbox === null)
        throw new Error("Unable to find 'toolbox'");
    if (toolbox.style.visibility === 'hidden')
        toolbox.style.visibility = 'visible';
    else
        toolbox.style.visibility = 'hidden';
}

function onDomKeyPress(event: KeyboardEvent): void {
    switch (event.key) {
        case "t": toggleToolbox(); break;
        case "f":
            if (currentTree !== undefined)
                TreeDisplay.focusTree();
            break;
        case "1":
            if (currentScheme !== undefined) {
                const str = TreeScheme.toString(currentScheme);
                alert(str);
                console.log(str);
            }
            else
                alert("No scheme is currently loaded");
            break;
        case "2":
            if (currentTree !== undefined) {
                const str = Tree.toString(currentTree);
                alert(str);
                console.log(str);
            }
            else
                alert("No tree is currently loaded");
            break;
    }
}
