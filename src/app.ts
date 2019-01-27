import * as Utils from "./utils";
import * as Sequencer from "./sequencer";
import * as Tree from "./tree";
import * as TreeParser from "./treeparser";
import * as TreeDisplay from "./treedisplay";

export async function run(): Promise<void> {
    sequencer = Sequencer.createRunner();

    Utils.subscribeToFileInput("opentree-file", enqueueLoadTree);
    Utils.subscribeToClick("openexample-button", () => enqueueLoadTree("example.tree.json"));

    console.log("Started running");

    enqueueLoadTree("example.tree.json");

    await sequencer.untilEnd;
    console.log("Stopped running");
}

let currentTree: Tree.Node | undefined = undefined;
let sequencer: Sequencer.SequenceRunner | undefined = undefined;

function enqueueLoadTree(source: string | File): void {
    sequencer!.enqueue(async () => {
        let result = await TreeParser.load(source);
        if (result.kind == "error")
            alert(`Failed to load. Error: ${result.errorMessage}`);
        else {
            console.log("Successfully loaded tree");
            // Tree.printNode(result.value, 2);
            setCurrentTree(result.value);
        }
    });
}

function setCurrentTree(node: Tree.Node): void {
    currentTree = node;
    TreeDisplay.setTree(currentTree);
}
