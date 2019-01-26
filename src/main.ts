import * as Tree from "./tree";
import * as TreeDisplay from "./treedisplay";

let rootNode = Tree.createNode("Conditions.If", b => {
    b.pushNodeField("evaluator", Tree.createNode("Evaluators.Time", b => {
        b.pushNumberField("afterTime", 2.34);
        b.pushBooleanField("invert", false);
    }));
    b.pushNodeField("node", Tree.createNode("Conditions.First", b => {
        b.pushNodeArrayField("children", [
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.DoesUnitsExist", b => {
                    b.pushStringArrayField("unitName", ["foo", "bar"]);
                }));
            }),
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.DoesUnitExist", b => {
                    b.pushStringField("unitName", "piet");
                }));
                b.pushNodeField("node", Tree.createNode("Conditions.First", b => {
                    b.pushNodeArrayField("children", [
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged", b => {
                                b.pushNumberField("abilityId", 1);
                            }))
                        }),
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged", b => {
                                b.pushNumberField("abilityId", 2);
                            }))
                        }),
                        Tree.createNode("Utilities.EvaluatorNodePair", b => {
                            b.pushNodeField("evaluator", Tree.createNode("Evaluators.IsAbilityCharged", b => {
                                b.pushNumberField("abilityId", 3);
                            }))
                        })
                    ]);
                }));
            }),
            Tree.createNode("Utilities.EvaluatorNodePair", b => {
                b.pushNodeField("evaluator", Tree.createNode("Evaluators.Test"));
            })
        ]);
    }));
});

Tree.printNode(rootNode);

TreeDisplay.initialize();
TreeDisplay.setTree(rootNode);

