import * as DomUtils from "./domutils";
import * as Sequencer from "./sequencer";
import * as Tree from "./tree";
import * as TreeParser from "./tree.parser";
import * as TreeSerializer from "./tree.serializer";
import * as TreeDisplay from "./tree.display";

/** Function to run the main app logic in. */
export async function run(): Promise<void> {
    sequencer = Sequencer.createRunner();

    window.onkeydown = onDomKeyPress;
    DomUtils.subscribeToClick("toolbox-toggle", toggleToolbox);
    DomUtils.subscribeToFileInput("opentree-file", enqueueLoadTree);
    DomUtils.subscribeToClick("openexample-button", () => enqueueLoadTree("example.tree.json"));
    DomUtils.subscribeToClick("savetree-button", enqueueSaveTree);
    DomUtils.subscribeToClick("focus-button", () => {
        if (currentTree !== undefined)
            TreeDisplay.focusTree();
    });

    console.log("Started running");

    enqueueLoadTree("example.tree.json");

    await sequencer.untilEnd;
    console.log("Stopped running");
}

let currentTree: Tree.Node | undefined = undefined;
let currentTitle: string | undefined = undefined;
let sequencer: Sequencer.SequenceRunner | undefined = undefined;

function enqueueLoadTree(source: string | File): void {
    const name = typeof source === "string" ? source : source.name;
    sequencer!.enqueue(async () => {
        const result = await TreeParser.load(source);
        if (result.kind === "error")
            alert(`Failed to load. Error: ${result.errorMessage}`);
        else {
            console.log(`Successfully loaded tree: ${name}`);
            // Tree.printNode(result.value, 2);
            setCurrentTree(result.value, name);
            TreeDisplay.focusTree();
        }
    });
}

function enqueueSaveTree(): void {
    sequencer!.enqueue(async () => {
        if (currentTree !== undefined) {
            const treeJson = TreeSerializer.composeJson(currentTree);
            DomUtils.saveJsonText(treeJson, currentTitle!);
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

function setCurrentTree(tree: Tree.Node | undefined, name?: string): void {
    currentTree = tree;
    currentTitle = name;
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
    if (toolbox.style.visibility === 'hidden') {
        toolbox.style.visibility = 'visible';
    }
    else {
        toolbox.style.visibility = 'hidden';
    }
}

function onDomKeyPress(event: KeyboardEvent): void {
    switch (event.key) {
        case "t": toggleToolbox(); break;
        case "f":
            if (currentTree !== undefined)
                TreeDisplay.focusTree();
            break;
    }
}
