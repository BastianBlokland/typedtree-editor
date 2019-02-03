import * as DomUtils from "./domutils";
import * as Sequencer from "./sequencer";
import * as Tree from "./tree";
import * as TreeParser from "./treeparser";
import * as TreeSerializer from "./treeserializer";
import * as TreeDisplay from "./treedisplay";

/** Function to run the main app logic in. */
export async function run(): Promise<void> {
    sequencer = Sequencer.createRunner();

    DomUtils.subscribeToFileInput("opentree-file", enqueueLoadTree);
    DomUtils.subscribeToClick("openexample-button", () => enqueueLoadTree("example.tree.json"));
    DomUtils.subscribeToClick("savetree-button", enqueueSaveTree);

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

function enqueueUpdateTree(oldTree: Tree.Node, newTree: Tree.Node, name: string): void {
    sequencer!.enqueue(async () => {
        if (oldTree === currentTree) {
            setCurrentTree(newTree, name);
        }
    });
}

function setCurrentTree(tree: Tree.Node, name: string): void {
    currentTree = tree;
    currentTitle = name;
    DomUtils.setText("tree-title", name);
    TreeDisplay.setTree(currentTree, newTree => {
        enqueueUpdateTree(tree, newTree, name);
    });
}
