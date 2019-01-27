import * as TreeParser from "./treeparser";
import * as TreeDisplay from "./treedisplay";
import * as Tree from "./tree";
import * as Sequencer from "./sequencer";

export async function run(): Promise<void> {
    sequencer = Sequencer.createRunner();

    let openTreeInput = document.getElementById("opentree-file");
    if (openTreeInput != null) {
        openTreeInput.onchange = _ => {
            let files = (<HTMLInputElement>openTreeInput).files;
            if (files != null && files.length > 0)
                enqueueLoadTree(files[0]);
        };
    }

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
            //Tree.printNode(result.value, 2);
            setCurrentTree(result.value);
        }
    });
}

function setCurrentTree(node: Tree.Node): void {
    currentTree = node;
    TreeDisplay.setTree(currentTree);
}
