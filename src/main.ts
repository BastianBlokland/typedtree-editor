import * as Tree from "./tree";
import * as TreeView from "./treeview";

let rootNode = Tree.createNode("Conditions.If", b => {
    b.pushNodeField("evaluator", Tree.createNode("Evaluators.CanExecute"));
    b.pushNodeField("node", Tree.createNode("Conditions.First", b => {
        b.pushNodeArrayField("children", [
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"));
            }),
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"));
                b.pushNodeField("node", Tree.createNode("Conditions.First", b => {
                    b.pushNodeArrayField("children", [
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"))
                        }),
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"))
                        }),
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"))
                        })
                    ]);
                }));
            }),
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"));
            })
        ]);
    }));
    b.pushNodeField("evaluator", Tree.createNode("Evaluators.CanExecute"));
    b.pushNodeField("node", Tree.createNode("Conditions.First", b => {
        b.pushNodeArrayField("children", [
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"));
            }),
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"));
            }),
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"));
                b.pushNodeField("node", Tree.createNode("Conditions.First", b => {
                    b.pushNodeArrayField("children", [
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"))
                        }),
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"))
                        }),
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged"))
                        })
                    ]);
                }));
            })
        ]);
    }));
});

Tree.printNode(rootNode);

TreeView.initialize();
TreeView.setTree(rootNode);

