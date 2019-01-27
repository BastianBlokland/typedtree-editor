import * as DomUtils from "./domutils";
import * as Sequencer from "./sequencer";
import * as Tree from "./tree";
import * as TreeParser from "./treeparser";
import * as TreeDisplay from "./treedisplay";

export async function run(): Promise<void> {
    sequencer = Sequencer.createRunner();

    DomUtils.subscribeToFileInput("opentree-file", enqueueLoadTree);
    DomUtils.subscribeToClick("openexample-button", () => enqueueLoadTree("example.tree.json"));

    console.log("Started running");

    enqueueLoadTree("example.tree.json");

    await sequencer.untilEnd;
    console.log("Stopped running");
}

let currentTree: Tree.Node | undefined = undefined;
let currentTitle: string | undefined = undefined;
let sequencer: Sequencer.SequenceRunner | undefined = undefined;

function enqueueLoadTree(source: string | File): void {
    let name = typeof source == "string" ? source : source.name;
    sequencer!.enqueue(async () => {
        let result = await TreeParser.load(source);
        if (result.kind == "error")
            alert(`Failed to load. Error: ${result.errorMessage}`);
        else {
            console.log(`Successfully loaded tree: ${name}`);
            // Tree.printNode(result.value, 2);
            setCurrentTree(result.value, name);
        }
    });
}

function setCurrentTree(node: Tree.Node, name: string): void {
    currentTree = node;
    currentTitle = name;
    DomUtils.setText("tree-title", name);
    TreeDisplay.setTree(currentTree);
}
