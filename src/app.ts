import * as TreeParser from "./treeparser";
import * as TreeDisplay from "./treedisplay";
import * as Tree from "./tree";

export async function run() {
    await loadFromUrl("example.tree.json");

    let openTreeInput = document.getElementById("opentree-file");
    if (openTreeInput != null)
        openTreeInput.onchange = _ => onOpenTreeInput((<HTMLInputElement>openTreeInput!).files);
}

let currentTree: Tree.Node | undefined = undefined;

function onOpenTreeInput(files: FileList | null): void {
    if (files == null || files.length == 0)
        return;
    loadFromFile(files[0]);
}

async function loadFromFile(file: File) {
    let result = await TreeParser.loadFromFile(file);
    if (result.kind == "error")
        alert(`Failed to load. Error: ${result.errorMessage}`);
    else {
        console.log(`Successfully loaded tree from: ${file.name}`);
        //Tree.printNode(result.value, 2);
        setCurrentTree(result.value);
    }
}

async function loadFromUrl(url: string) {
    let result = await TreeParser.loadFromUrl(url);
    if (result.kind == "error")
        alert(`Failed to load. Error: ${result.errorMessage}`);
    else {
        console.log(`Successfully loaded tree from: ${url}`);
        //Tree.printNode(result.value, 2);
        setCurrentTree(result.value);
    }
}

function setCurrentTree(node: Tree.Node): void {
    currentTree = node;
    TreeDisplay.setTree(currentTree);
}
