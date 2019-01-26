import * as TreeDisplay from "./treedisplay";
import * as TreeParser from "./treeparser";

TreeDisplay.initialize();

TreeParser.download("example.tree.json").then(result => {
    if (result.kind == "error") {
        alert(`Failed to load data. Error: ${result.errorMessage}`);
        return;
    }
    TreeDisplay.setTree(result.value);
});
