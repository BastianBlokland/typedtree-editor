import * as Tree from "./tree";

import * as SVG_ from "svg.js";
declare const SVG: typeof SVG_;

var draw = SVG("tree-drawing").size(300, 300)
draw.rect(100, 100).attr({ fill: '#f06' })

let rootNode = Tree.createNode("Conditions.If", b => {
    b.pushNodeField("evaluator", Tree.createNode("Evaluators.CanExecute"));
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
});

Tree.printNode(rootNode);

console.log('hello, world');
