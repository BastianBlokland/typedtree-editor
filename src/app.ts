import * as TreeParser from "./treeparser";
import * as TreeDisplay from "./treedisplay";
import * as Tree from "./tree";

export async function run() {
    await loadFromUrl("example.tree.json");
}

let currentTree: Tree.Node | undefined = undefined;

async function loadFromUrl(url: string) {
    let result = await TreeParser.download(url);
    if (result.kind == "error")
        alert(`Failed to load. Error: ${result.errorMessage}`);
    else {
        console.log(`Successfully loaded tree from: ${url}`);
        setCurrentTree(result.value);
    }
}

function setCurrentTree(node: Tree.Node): void {
    currentTree = node;
    TreeDisplay.setTree(currentTree);
    console.log("Loaded tree:");
    Tree.printNode(node, 2);
}
